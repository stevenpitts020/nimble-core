describe('app.services.creditReport.create', () => {

  const validPayload = {
    reference: '111-2222-333',
    score: 800,
    reportDate: '2020-09-16T11:32:38.558Z',
    documentId: '00000000-0000-0000-0000-000000000000',
    signerId: '2e31d8c0-1226-4651-8a5d-4bd8aa454722',
  }

  describe('when validating', () => {
    it('should return error if signerId is not a uuid', async () => {
      const id = 'asdsd'
      const expectedErrorMsg = '"signerId" must be a valid GUID'
      return expect(app.services.creditReport.create({...validPayload, signerId: id})).to.be.rejectedWith(expectedErrorMsg)
    })

    it('should return error if signer not found', async () => {
      const expectedErrorMsg = "The requested resource couldn't be found"
      return expect(app.services.creditReport.create(validPayload)).to.be.rejectedWith(expectedErrorMsg)
    })

    it('should return error if score is invalid float', async () => {
      const expectedErrorMsg = "The requested resource couldn't be found"
      return expect(app.services.creditReport.create({...validPayload, score: 3.6})).to.be.rejectedWith(expectedErrorMsg)
    })

    it('should return error if payload is invalid', async () => {
      const expectedErrorMsg = 'The minimal required parameters for this endpoint were not met. "reference" must be a string."score" must be a number'
      return expect(app.services.creditReport.create({...validPayload, score: 'aaa', reference: null, reportDate: null})).to.be.rejectedWith(expectedErrorMsg)
    })
  })

  describe('when calling with valid data', () => {
    beforeEach(async () => {
      await seed.institution.create()
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
      await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d310')
      await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d340') // required by seed.account_request_products
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.document.create()
      await seed.accountRequest.create('2552ab85-08da-4bb5-be00-9e94d282d348')
      await seed.accountRequest.create('17ba2033-1c12-463b-bbc7-72deed747ae7') // required by seed.account_request_products
      await seed.account_request_products() // insert all
      await seed.account_request_product_options() // insert all
      await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
      await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454721')
      await knex.raw("UPDATE signers SET status='PENDING'")
    })

    it('should exist', () => {
      expect(app.services.creditReport.create).not.to.be.undefined
    })

    it('create a valid credit report', async () => {
      const id = await app.services.creditReport.create(validPayload)

      const result = await knex.raw(`SELECT * FROM signer_credit_reports WHERE id='${id}'`)
      expect(result.rows[0].score).to.equal(800)
      expect(result.rows[0].document_id).to.equal('00000000-0000-0000-0000-000000000000')
      expect(result.rows[0].error_code).to.equal(null)
      expect(result.rows[0].report_date).not.to.equal(null)
    })

    it('create a valid credit report with no score', async () => {
      const id = await app.services.creditReport.create({...validPayload, score: null, reportDate: null, documentId: null })

      const result = await knex.raw(`SELECT * FROM signer_credit_reports WHERE id='${id}'`)
      expect(result.rows[0].score).to.equal(null)
      expect(result.rows[0].report_date).to.equal(null)
      expect(result.rows[0].document_id).to.equal(null)
      expect(result.rows[0].error_code).to.equal(null)
    })

  })
})
