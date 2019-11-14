module.exports = (rs) ->
  rs.use '/dentastix', (req, res, next) ->
    console.log 'dentastix', rs.root
    res.end 'yum' + rs.root