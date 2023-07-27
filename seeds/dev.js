const seeds = require('../test/support/seeds')

exports.seed = async function () {
  return seeds.flush().then(async () => {
    await seeds.institutions()
    await seeds.institution_branches()
    await seeds.users()
    await seeds.accounts()
    await seeds.account_recoveries()
    await seeds.documents()
    await seeds.account_requests()
    await seeds.signers()
    await seeds.signers_identity_verifications()
    await seeds.products()
    await seeds.product_options()
    await seeds.account_request_products()
    await seeds.signer_credit_reports()
    await seeds.signer_compliance_verifications()
    await seeds.signer_compliance_verification_items()
    await seeds.signer_compliance_verification_list_entries()
    await seeds.bsa_risk_results()
    await seeds.docusign_templates()
  })
}
