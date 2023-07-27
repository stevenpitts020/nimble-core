const app = require('../core')

const Account = app.db.Model.extend({
  tableName: 'accounts',
  requireFetch: false,
  hasTimestamps: true,
})

module.exports = app.db.model('Account', Account)
