(function() {
  'use strict';
  var app, apps, base, express, glob, http, ogid, path;

  express = require('express');

  http = require('http');

  glob = require('glob');

  path = require('path');

  ogid = require('ogid');

  console.log(ogid());

  app = express();

  apps = {};

  base = path.join(process.cwd(), 'build');

  module.exports = {
    apps: apps,
    app: function(config) {
      var i, j, len, len1, method, proxyFn, rainstorm, ref, server, subapp, subapps;
      config = config || {};
      config.root = config.root || '';
      console.log('configgin', config);
      proxyFn = function(method) {
        return function() {
          var url;
          url = config.root + arguments[0];
          console.log('configuring route', url);
          arguments[0] = url;
          app[method].apply(app, arguments);
          return this;
        };
      };
      rainstorm = {
        static: express.static,
        database: (config.dbEngine || {})(config),
        root: config.root,
        config: config,
        base: base,
        service: function(fn) {
          fn(rainstorm);
          return this;
        }
      };
      rainstorm.db = rainstorm.database;
      ref = ['all', 'use', 'get', 'post', 'put', 'delete'];
      for (i = 0, len = ref.length; i < len; i++) {
        method = ref[i];
        rainstorm[method] = proxyFn(method);
      }
      //for folder in ['services', 'controllers']
      //  modules = glob.sync path.join base, "#{folder}/**/*.js" 
      //  for module in modules
      //    require(module) rainstorm
      subapps = glob.sync(path.join(base, '../apps/*/server/app.js'));
      if (!config.root) {
        app.get('*', function(req, res, next) {
          var fullurl, key, rs, subapp;
          fullurl = req.hostname + req.url;
          rs = null;
          for (key in apps) {
            subapp = apps[key];
            if (fullurl.indexOf(key) === 0) {
              req.url = key + fullurl.replace(key, '');
              req.rs = subapp;
              break;
            }
          }
          console.log(req.url);
          return next('route');
        });
        for (j = 0, len1 = subapps.length; j < len1; j++) {
          subapp = subapps[j];
          base = path.dirname(subapp);
          require(subapp);
        }
        server = http.createServer(app);
        server.listen(3000, function() {
          return console.log('started');
        });
      } else {
        console.log('loaded', config.root);
        this.apps[config.root] = rainstorm;
      }
      return rainstorm;
    }
  };

}).call(this);

//# sourceMappingURL=index.js.map
