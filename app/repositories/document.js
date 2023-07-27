const app = require('../core')

const Document = app.db.Model.extend({
  tableName: 'documents',
  requireFetch: false,
  hasTimestamps: true
})

module.exports = app.db.model('Document', Document)
