const app = require('../core')

const AccountRecovery = app.db.Model.extend({
  tableName: 'account_recoveries',
  requireFetch: false,
  hasTimestamps: true,

  account: function() {
    return this.belongsTo('Account', 'account_id')
  }
})

module.exports = app.db.model('AccountRecovery', AccountRecovery)
