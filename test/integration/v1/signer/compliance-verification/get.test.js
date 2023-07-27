const uuid = require('uuid')

describe('GET /signers/:id/compliance-verification', async () => {
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
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.document.create()
    await seed.accountRequest.create('2552ab85-08da-4bb5-be00-9e94d282d348')
    await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
    await seed.signerComplianceVerification.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
    await seed.signerComplianceVerificationItem.create('1e31d8c0-1226-4651-8a5d-4bd8aa454721')
    await seed.signerComplianceVerificationListEntry.create('20000000-0000-accc-0000-00bbbbbbb221')
    await seed.signerComplianceVerificationListEntry.create('20000000-0000-accc-0000-00bbbbbbb222')
    await seed.signerComplianceVerificationListEntry.create('20000000-0000-accc-0000-00bbbbbbb223')
    token = await helpers.getAuthToken()
  })

  describe('with invalid auth', () => {
    it('should return 401 if no auth', async () => {
      return request(app.server)
        .get('/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/compliance-verifications')
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should return 401 if bad auth', async () => {
      return request(app.server)
        .get('/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/compliance-verifications')
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
        .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/compliance-verifications`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + badToken)
        .expect(404)
    })
  })

  describe('with invalid params', () => {
    it('should return 400 with invalid uuid as id', async () => {
      const id = 'invalid-uuid-here'
      return request(app.server)
        .get(`/v1/signers/${id}/compliance-verifications`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(400)
    })

    it('should return 404 with random uuid', async () => {
      const id = uuid.v4()
      return request(app.server)
        .get(`/v1/signers/${id}/compliance-verifications`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(404)
    })
  })


  describe('with valid params', () => {

    it('should return an array of objects', async () => {
      return request(app.server)
        .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/compliance-verifications`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect(response => {
          expect(response.body).to.be.an('array')
          expect(response.body[0]).to.be.an('object')
        })
    })

    it.skip('should fetch a compliance verification with the right schema', async () => {
      return request(app.server)
        .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/compliance-verifications`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect(response => {
          expect(response.body[0]).to.deep.equal(blueprints.signer_compliance_verifications.signer_compliance_verification_2)
        })
    })
  })
})
