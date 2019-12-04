'use strict'
express = require 'express'
fs = require 'fs-extra'
http = require 'http'
glob = require 'glob'
path = require 'path'
ogid = require 'ogid'
compression = require 'compression'
bodyParser = require 'body-parser'
helmet = require 'helmet'
pug = require 'pug'

app = express()
apps = {}
base = process.cwd()
root = ''
server = null
socket = null
fetchTemplate = (templateName, appBase) ->
  templatePath = path.join appBase, 'templates', templateName
  if await fs.exists templatePath
    return fs.readFile templatePath, 'utf8'
  templatePath = path.join __dirname, '../templates', templateName
  if await fs.exists templatePath
    return fs.readFile templatePath, 'utf8'
  return 'p missing template'
module.exports = 
  apps: apps
  app: (config) ->
    config = config or {}
    config.root = root or ''
    config.base = base or ''
    proxyFn = (method) ->
      ->
        url = config.root + arguments[0]
        arguments[0] = url
        app[method].apply app, arguments
        @
    pkg = require path.join config.base, 'package.json'
    rainstorm = 
      name: pkg.name
      static: express.static
      database: (config.dbEngine or () ->) config
      root: config.root
      config: config
      base: config.base
      serverId: ogid 23
      service: (fn) ->
        fn rainstorm
        @
      subapp: (_root, _base) ->
        root = _root
        base = path.join process.cwd(), _base
        require base
    rainstorm.db = rainstorm.database
    rainstorm[method] = proxyFn method for method in ['all', 'use', 'get', 'post', 'put', 'delete']
    if not root
      app.get '*', (req, res, next) ->
        fullurl = req.hostname + req.url
        rs = null
        for key, subapp of apps
          if new RegExp(key).test fullurl
            req.url = key + fullurl.replace(key, '')
            req.rs = subapp
            break
        req.rs = req.rs or apps['rsdefault']
        next 'route'
      @apps['rsdefault'] = rainstorm
      port = config.port or process.env.PORT or 3000
      server = http.createServer app
      server.listen port, ->
        console.log 'rainstorm started on port ' + port
      rainstorm.server = server
      if config.socket
        config.socket rainstorm
        socket = rainstorm.socket
        socket.setup rainstorm
    else
      rainstorm.server = server
      rainstorm.socket = socket
      socket.setup rainstorm if socket
      @apps[root] = rainstorm
    rainstorm.get '/register-app', (req, res, next) ->
      template = await fetchTemplate 'register-app.pug', req.rs.base
      res.writeHead 200,
        'Content-Type': 'text/html'
      res.end pug.render template,
        apps: apps
    rainstorm.use '*', compression()
    rainstorm.use '*', helmet()
    rainstorm.use '*', bodyParser.json
      limit: config.bodyParser or '50mb'
    rainstorm