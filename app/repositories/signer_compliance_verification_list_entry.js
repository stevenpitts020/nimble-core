const app = require('../core')

const SignerComplianceVerificationListEntry = app.db.Model.extend({
  tableName: 'signer_compliance_verification_list_entries',
  requireFetch: false,
  hasTimestamps: true,
})

module.exports = app.db.model('SignerComplianceVerificationListEntry', SignerComplianceVerificationListEntry)
