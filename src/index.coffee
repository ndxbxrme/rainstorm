'use strict'
express = require 'express'
http = require 'http'
glob = require 'glob'
path = require 'path'
ogid = require 'ogid'
console.log ogid()

app = express()
apps = {}
base = process.cwd()
if not /[\\\/]+server^/.test base
  base = path.join base, 'server'
module.exports = 
  apps: apps
  app: (config) ->
    console.log 'configgin', config
    proxyFn = (method) ->
      ->
        url = config.root + arguments[0]
        console.log 'configuring route', url
        arguments[0] = url
        app[method].apply app, arguments
        @
    rainstorm = 
      database: (config.dbEngine or require('rsdb') or {}) config
      root: config.root
      config: config
      base: base
      service: (fn) ->
        fn rainstorm
        @
    rainstorm[method] = proxyFn method for method in ['all', 'use', 'get', 'post', 'put', 'delete']
    for folder in ['services', 'controllers']
      modules = glob.sync path.join base, "#{folder}/**/*.js" 
      for module in modules
        require(module) rainstorm
    subapps = glob.sync path.join base, '../apps/*/server/app.js'
    if not config.root
      app.get '*', (req, res, next) ->
        fullurl = req.hostname + req.url
        rs = null
        for key, subapp of apps
          if fullurl.indexOf(key) is 0
            req.url = key + fullurl.replace(key, '')
            req.rs = subapp
            break
        console.log req.url
        next('route')
      for subapp in subapps
        base = path.dirname(subapp)
        require subapp
      server = http.createServer app
      server.listen 3000, ->
        console.log 'started'
    else
      console.log 'loaded', config.root
      @apps[config.root] = rainstorm
    rainstorm