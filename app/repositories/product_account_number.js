const app = require('../core')

const ProductAccountNumber = app.db.Model.extend({
  tableName: 'product_account_numbers',
  requireFetch: false,
  hasTimestamps: true,

  institution: function () {
    return this.belongsTo('Institution', 'institution_id')
  },

  account_request: function () {
    return this.belongsTo('AccountRequest', 'account_request_id')
  },
})

module.exports = app.db.model('ProductAccountNumber', ProductAccountNumber)
