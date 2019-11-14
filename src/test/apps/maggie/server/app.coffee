rainstorm = require '../../../../index'

rainstorm.app
  root: 'localhost/maggie'
  database: 'maggie'
  localStorage: 'data'
  tables: ['users']
.use '/bath', (req, res, next) ->
  res.end 'i hatez it ' + req.rs?.root