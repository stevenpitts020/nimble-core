const app = require('../core')

const SignerComplianceVerification = app.db.Model.extend({
  tableName: 'signer_compliance_verifications',
  requireFetch: false,
  hasTimestamps: true,

  signer: function () {
    return this.belongsTo('Signer', 'signer_id')
  },

  results: function() {
    return this.hasMany('SignerComplianceVerificationItem', 'signer_compliance_verification_id')
  },
})

module.exports = app.db.model('SignerComplianceVerification', SignerComplianceVerification)
