const app = require('../core')

const SignerComplianceVerificationItem = app.db.Model.extend({
  tableName: 'signer_compliance_verification_items',
  requireFetch: false,
  hasTimestamps: true,

  items: function() {
    return this.hasMany('SignerComplianceVerificationListEntry', 'signer_compliance_verification_item_id')
  }
})

module.exports = app.db.model('SignerComplianceVerificationItem', SignerComplianceVerificationItem)
