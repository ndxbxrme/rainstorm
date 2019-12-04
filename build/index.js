(function() {
  'use strict';
  var app, apps, base, bodyParser, compression, express, fetchTemplate, fs, glob, helmet, http, ogid, path, pug, root, server, socket;

  express = require('express');

  fs = require('fs-extra');

  http = require('http');

  glob = require('glob');

  path = require('path');

  ogid = require('ogid');

  compression = require('compression');

  bodyParser = require('body-parser');

  helmet = require('helmet');

  pug = require('pug');

  app = express();

  apps = {};

  base = process.cwd();

  root = '';

  server = null;

  socket = null;

  fetchTemplate = async function(templateName, appBase) {
    var templatePath;
    templatePath = path.join(appBase, 'templates', templateName);
    if ((await fs.exists(templatePath))) {
      return fs.readFile(templatePath, 'utf8');
    }
    templatePath = path.join(__dirname, '../templates', templateName);
    if ((await fs.exists(templatePath))) {
      return fs.readFile(templatePath, 'utf8');
    }
    return 'p missing template';
  };

  module.exports = {
    apps: apps,
    app: function(config) {
      var i, len, method, pkg, port, proxyFn, rainstorm, ref;
      config = config || {};
      config.root = root || '';
      config.base = base || '';
      proxyFn = function(method) {
        return function() {
          var url;
          url = config.root + arguments[0];
          arguments[0] = url;
          app[method].apply(app, arguments);
          return this;
        };
      };
      pkg = require(path.join(config.base, 'package.json'));
      rainstorm = {
        name: pkg.name,
        static: express.static,
        database: (config.dbEngine || {})(config),
        root: config.root,
        config: config,
        base: config.base,
        serverId: ogid(23),
        service: function(fn) {
          fn(rainstorm);
          return this;
        },
        subapp: function(_root, _base) {
          root = _root;
          base = path.join(process.cwd(), _base);
          return require(base);
        }
      };
      rainstorm.db = rainstorm.database;
      ref = ['all', 'use', 'get', 'post', 'put', 'delete'];
      for (i = 0, len = ref.length; i < len; i++) {
        method = ref[i];
        rainstorm[method] = proxyFn(method);
      }
      if (!root) {
        app.get('*', function(req, res, next) {
          var fullurl, key, rs, subapp;
          fullurl = req.hostname + req.url;
          rs = null;
          for (key in apps) {
            subapp = apps[key];
            if (new RegExp(key).test(fullurl)) {
              req.url = key + fullurl.replace(key, '');
              req.rs = subapp;
              break;
            }
          }
          req.rs = req.rs || apps['rsdefault'];
          return next('route');
        });
        this.apps['rsdefault'] = rainstorm;
        port = config.port || process.env.PORT || 3000;
        server = http.createServer(app);
        server.listen(port, function() {
          return console.log('rainstorm started on port ' + port);
        });
        rainstorm.server = server;
        if (config.socket) {
          config.socket(rainstorm);
          socket = rainstorm.socket;
          socket.setup(rainstorm);
        }
      } else {
        rainstorm.server = server;
        rainstorm.socket = socket;
        if (socket) {
          socket.setup(rainstorm);
        }
        this.apps[root] = rainstorm;
      }
      rainstorm.get('/register-app', async function(req, res, next) {
        var template;
        template = (await fetchTemplate('register-app.pug', req.rs.base));
        res.writeHead(200, {
          'Content-Type': 'text/html'
        });
        return res.end(pug.render(template, {
          apps: apps
        }));
      });
      rainstorm.use('*', compression());
      rainstorm.use('*', helmet());
      rainstorm.use('*', bodyParser.json({
        limit: config.bodyParser || '50mb'
      }));
      return rainstorm;
    }
  };

}).call(this);

//# sourceMappingURL=index.js.map
