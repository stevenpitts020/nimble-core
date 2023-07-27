const app = require('../core')

const SignerCreditReport = app.db.Model.extend({
  tableName: 'signer_credit_reports',
  requireFetch: false,
  hasTimestamps: true,

  signer: function () {
    return this.belongsTo('Signer', 'signer_id')
  },

})

module.exports = app.db.model('SignerCreditReport', SignerCreditReport)
