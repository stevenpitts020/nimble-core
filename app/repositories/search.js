const app = require('../core')

const Search = app.db.Model.extend({
  tableName: 'searches',
  requireFetch: false,
  hasTimestamps: true
})

module.exports = app.db.model('Search', Search)
