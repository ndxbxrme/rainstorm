rainstorm = require '../../../../index'
path = require 'path'

rainstorm.app
  root: 'localhost/buddy'
  database: 'buddy'
  localStorage: 'data'
  tables: ['users']
.service (rs) ->
  rs.database.on 'ready', ->
    console.log 'buddy\'z db is ready'
    await rs.database.users.insert
      name: 'buddy'
    users = await rs.database.users.select()
    console.log users
  setTimeout ->
    console.log rs.base
    rs.all '/*', (req, res) ->
      res.sendFile 'index.html', root: path.join rs.base, '../client'
.get '/bath', (req, res, next) ->
  users = await req.rs.database.users.select()
  res.json users