const sinon = require('sinon')
const { Consumer } = require('sqs-consumer')
const mocks = require('../../support/mock/comply_advantage')

function message(msg) {
  return { Body: JSON.stringify(msg) }
}

describe('app.services.subscriber.compliance', () => {

  afterEach(() => sinon.restore())

  it('should exist', () => {
    expect(app.services.subscriber.compliance).not.to.be.undefined
    expect(app.services.subscriber.compliance).to.be.an('function')
  })

  it('should return a message queue Consumer', () => {
    const target = app.services.subscriber.compliance()

    expect(target).to.be.an('object')
    expect(target).to.be.instanceOf(Consumer)
    expect(target).to.have.ownProperty('handleMessage')
    expect(target.handleMessage).to.be.an('function')
  })

  describe('.handleMessage()', () => {

    beforeEach(async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.document.create()
      await seed.accountRequest.create('2552ab85-08da-4bb5-be00-9e94d282d348')
      await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
      await knex.raw("UPDATE signers SET status='PENDING'")
    })

    it('should call app.services.compliance.check with message.id', async () => {
      const fakeService = sinon.replace(app.services.compliance, 'verify', sinon.fake())

      const target = app.services.subscriber.compliance()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeService).to.have.been.calledOnce
      expect(fakeService).to.have.been.calledWith(blueprints.signers.signer_1.id)
    })


    it('should save verification result on db when responding with no data', async () => {
      const fakeComplianceSearchFn = sinon.fake.returns({ search: { name: 'something' }, result: {}, hits: [] })
      const fakeComplianceExportFn = sinon.fake.returns({ id: '00000000-0000-0000-0000-000000000000' })
      sinon.replace(app.services.compliance, 'search', fakeComplianceSearchFn)
      sinon.replace(app.services.compliance, 'export', fakeComplianceExportFn)

      const target = app.services.subscriber.compliance()

      // call target
      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      const result = await knex.raw("SELECT * FROM signer_compliance_verifications")
      expect(result.rows[0].status).to.equal('unknown')
      expect(result.rows[0].search_object).to.deep.equal({ name: 'something' })
      expect(result.rows[0].signer_id).to.equal(blueprints.signers.signer_1.id)
      expect(result.rows[0].document_id).to.equal('00000000-0000-0000-0000-000000000000')
    })


    it('should save verification result on db when responding with big data', async () => {
      const fakeComplianceResultFn = sinon.fake.returns(Promise.resolve({ data: mocks.successResponse }))
      const fakeComplianceExportFn = sinon.fake.returns({ id: '00000000-0000-0000-0000-000000000000' })
      sinon.replace(app.repositories.complyAdvantage, 'post', fakeComplianceResultFn)
      sinon.replace(app.services.compliance, 'export', fakeComplianceExportFn)

      const target = app.services.subscriber.compliance()

      // call target
      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      const result = await knex.raw("SELECT * FROM signer_compliance_verifications")
      expect(result.rows[0].status).to.equal('potential_match')

      expect(result.rows[0].search_object).to.deep.equal({
        exact_match: true,
        filters: {
          birth_year: 1945,
          entity_type: "person",
          types: ["sanction", "pep", "adverse-media", "adverse-media-financial-crime"],
        },
        search_term: "George Constanza"
      })
      expect(result.rows[0].signer_id).to.equal(blueprints.signers.signer_1.id)

      const result_items = await knex.raw("SELECT * FROM signer_compliance_verification_items")

      expect(result_items.rows).to.have.lengthOf(2)
      expect(result_items.rows[0].signer_compliance_verification_id).to.equal(result.rows[0].id)
      expect(result_items.rows[0].full_name).to.equal('Mugabe Robert Gabriel')

      const result_entries = await knex.raw("SELECT * FROM signer_compliance_verification_list_entries")

      expect(result_entries.rows).to.have.lengthOf(226)
    })


    it('should download and save compliance report', async () => {
      const fakeComplianceResultFn = sinon.fake.returns(Promise.resolve({ data: mocks.successResponse }))
      const fakeComplianceGetCertificateFn = sinon.fake.returns({ data: Buffer.from('0000') })
      const fakeAwsS3uploadFn = sinon.fake.returns(Promise.resolve(true))
      sinon.replace(app.repositories.complyAdvantage, 'post', fakeComplianceResultFn)
      sinon.replace(app.repositories.complyAdvantage, 'getCertificate', fakeComplianceGetCertificateFn)
      sinon.replace(app.plugins.aws, 's3Upload', fakeAwsS3uploadFn)

      const target = app.services.subscriber.compliance()

      // call target
      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      const result = await knex.raw("SELECT * FROM signer_compliance_verifications")

      // expect call to export
      const searchId = mocks.successResponse.content.data.id
      expect(fakeComplianceGetCertificateFn).to.have.been.calledWith(searchId)

      // expect pdf upload
      expect(fakeAwsS3uploadFn).to.have.been.calledOnce

      // expect last saved document to match
      const documents = await knex.raw("SELECT * FROM documents ORDER BY created_at DESC limit 1")
      expect(result.rows[0].document_id).to.equal(documents.rows[0].id)
      expect(result.rows[0].search_id).to.equal(searchId.toString())
    })

    it('should should only run once even if called twice', async () => {
      const fakeComplianceResultFn = sinon.fake.returns(Promise.resolve({ data: mocks.successResponse }))
      const fakeComplianceGetCertificateFn = sinon.fake.returns({ data: Buffer.from('0000') })
      const fakeAwsS3uploadFn = sinon.fake.returns(Promise.resolve(true))
      sinon.replace(app.repositories.complyAdvantage, 'post', fakeComplianceResultFn)
      sinon.replace(app.repositories.complyAdvantage, 'getCertificate', fakeComplianceGetCertificateFn)
      sinon.replace(app.plugins.aws, 's3Upload', fakeAwsS3uploadFn)

      const target = app.services.subscriber.compliance()

      // call target
      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))
      // call target again
      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      // expect call to export
      expect(fakeComplianceGetCertificateFn).to.have.been.calledOnce

      // expect pdf upload
      expect(fakeAwsS3uploadFn).to.have.been.calledOnce
    })

  })

})
