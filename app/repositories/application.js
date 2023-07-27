const app = require('../core')

const Application = app.db.Model.extend({
  tableName: 'applications',
  requireFetch: false,
  hasTimestamps: true
})

module.exports = app.db.model('Application', Application)
