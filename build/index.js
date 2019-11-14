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

  base = process.cwd();

  if (!/[\\\/]+server^/.test(base)) {
    base = path.join(base, 'server');
  }

  module.exports = {
    apps: apps,
    app: function(config) {
      var folder, i, j, k, l, len, len1, len2, len3, method, module, modules, proxyFn, rainstorm, ref, ref1, server, subapp, subapps;
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
        database: (config.dbEngine || require('rsdb') || {})(config),
        root: config.root,
        config: config,
        base: base,
        service: function(fn) {
          fn(rainstorm);
          return this;
        }
      };
      ref = ['all', 'use', 'get', 'post', 'put', 'delete'];
      for (i = 0, len = ref.length; i < len; i++) {
        method = ref[i];
        rainstorm[method] = proxyFn(method);
      }
      ref1 = ['services', 'controllers'];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        folder = ref1[j];
        modules = glob.sync(path.join(base, `${folder}/**/*.js`));
        for (k = 0, len2 = modules.length; k < len2; k++) {
          module = modules[k];
          require(module)(rainstorm);
        }
      }
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
        for (l = 0, len3 = subapps.length; l < len3; l++) {
          subapp = subapps[l];
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
