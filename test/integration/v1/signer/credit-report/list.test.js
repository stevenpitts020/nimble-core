const uuid = require('uuid')

describe('GET /signers/:id/credit-reports', async () => {
  let clock, token

  before(async () => {
    clock = sinon.useFakeTimers({
      toFake: ['Date']
    })
  })

  after(() => {
    clock.restore()
  })

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

    await seed.signerCreditReport.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
    await seed.signerCreditReport.create('2e31d8c0-1226-4651-8a5d-4bd8aa454721')

    token = await helpers.getAuthToken()
  })

  describe('with invalid auth', () => {
    it('should return 401 if no auth', async () => {
      return request(app.server)
        .get('/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/credit-reports')
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should return 401 if bad auth', async () => {
      return request(app.server)
        .get('/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/credit-reports')
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + "AAAA")
        .expect(401)
    })

    it('should return 404 if user does not belong to institution', async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000020')
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d350')
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d350')
      const badToken = await helpers.getAuthToken('1052ab85-08da-4bb5-be00-9e94d282d350')

      return request(app.server)
        .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/credit-reports`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + badToken)
        .expect(404)
    })
  })

  describe('with invalid params', () => {
    it('should return 400 with invalid uuid as id', async () => {
      const id = 'invalid-uuid-here'
      return request(app.server)
        .get(`/v1/signers/${id}/credit-reports`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(400)
    })

    it('should return 404 with random uuid', async () => {
      const id = uuid.v4()
      return request(app.server)
        .get(`/v1/signers/${id}/credit-reports`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(404)
    })
  })


  describe('with valid params', () => {
    it('should return an array of objects', async () => {
      return request(app.server)
        .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/credit-reports`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(response => {
          expect(response.body).to.be.an('array')
          expect(response.body[0]).to.be.an('object')
        })
        .expect(200)
    })

    it('should fetch a credit report with the right schema', async () => {
      return request(app.server)
        .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/credit-reports`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect(response => {
          expect(response.body[0]).to.deep.equal(blueprints.signer_credit_reports.signer_credit_report_1)
        })
    })

    it('should fetch a credit report with a failed credit score', async () => {
      return request(app.server)
        .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454721/credit-reports`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect(response => {
          expect(response.body[0]).to.deep.equal(blueprints.signer_credit_reports.signer_credit_report_2)
        })
    })

    it('should accept sort limit and offset params', async () => {
      return request(app.server)
        .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454721/credit-reports?limit=1&offset=0&sort=-updated_at`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect(response => {
          expect(response.body[0]).to.deep.equal(blueprints.signer_credit_reports.signer_credit_report_2)
        })
    })

  })
})
