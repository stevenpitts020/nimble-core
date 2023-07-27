const uuid = require('uuid')
const mock = require('../../../support/mock/shufti')
const sinon = require('sinon')

describe('POST /v1/webhooks/shufti/identity-verification', async () => {
  let clock, createSpy

  before(async () => {
    createSpy = sinon.spy(app.services.identityVerification, 'create')
    clock = sinon.useFakeTimers({
      toFake: ['Date']
    })
  })

  after(() => {
    sinon.restore()
    clock.restore()
  })

  beforeEach(async () => {
    sinon.reset()
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.document.create()
    await seed.accountRequest.create('2552ab85-08da-4bb5-be00-9e94d282d348')
    await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
  })

  describe('validations', () => {

    it('should return 400 if reference is not a valid signer uuid', async () => {
      return request(app.server)
        .post('/v1/webhooks/shufti/identity-verification')
        .send({ reference: 'asd', event: 'verification.accepted' })
        .expect('Content-Type', /json/)
        .expect(400)
    })


    it('should return 401 if reference was not found', async () => {
      return request(app.server)
        .post('/v1/webhooks/shufti/identity-verification')
        .send({ reference: uuid.v4(), event: 'verification.accepted' })
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should validate schema', async () => {
      return request(app.server)
        .post('/v1/webhooks/shufti/identity-verification')
        .send({ reference: '2e31d8c0-1226-4651-8a5d-4bd8aa454722', event: null })
        .expect('Content-Type', /json/)
        .expect(400)
    })
  })


  it('should try to create verifications in DB', async () => {
    return request(app.server)
      .post('/v1/webhooks/shufti/identity-verification')
      .send({ event: 'verification.accepted', reference: '2e31d8c0-1226-4651-8a5d-4bd8aa454722', verification_result: mock.verificationAccepted.verification_result })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(() => {
        expect(createSpy.callCount).to.equal(11)
        expect(createSpy.called).to.equal(true)
      })
  })


  it('should save an expected list of verifications on success', async () => {
    return request(app.server)
      .post('/v1/webhooks/shufti/identity-verification')
      .send({ event: 'verification.accepted', reference: '2e31d8c0-1226-4651-8a5d-4bd8aa454722', verification_result: mock.verificationAccepted.verification_result })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(() => {
        const spyCalls = createSpy.getCalls().map(c => c.args[0])
        const status = spyCalls.map(c => c.status)
        const expectedStatus = ["VALID", "VALID", "VALID", "VALID", "VALID", "VALID", "VALID", "VALID", "VALID", "VALID", "VALID"]
        expect(spyCalls).to.have.lengthOf(11)
        expect(status).to.deep.equal(expectedStatus)
      })
  })

  it('should save an expected list of verifications on failure', async () => {
    return request(app.server)
      .post('/v1/webhooks/shufti/identity-verification')
      .send({ event: 'verification.declined', reference: '2e31d8c0-1226-4651-8a5d-4bd8aa454722', verification_result: mock.verificationDeclinedFace.verification_result })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(() => {
        const spyCalls = createSpy.getCalls().map(c => c.args[0])
        const status = spyCalls.map(c => c.status)
        const expectedStatus = ["INVALID", "INVALID", "INVALID", "VALID", "VALID", "VALID", "VALID", "INVALID", "VALID", "INVALID", "VALID"]
        expect(spyCalls).to.have.lengthOf(11)
        expect(status).to.deep.equal(expectedStatus)
      })
  })

  it('should do nothing without verification_result', async () => {
    return request(app.server)
      .post('/v1/webhooks/shufti/identity-verification')
      .send({ event: 'request.pending', reference: '2e31d8c0-1226-4651-8a5d-4bd8aa454722' })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(() => {
        const spyCalls = createSpy.getCalls()
        expect(spyCalls).to.have.lengthOf(0)
      })
  })

  it('should save an expected list of INVALID verifications on error', async () => {
    return request(app.server)
      .post('/v1/webhooks/shufti/identity-verification')
      .send({ event: 'request.invalid', reference: '2e31d8c0-1226-4651-8a5d-4bd8aa454722', verification_result: mock.verificationAccepted.verification_result })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(() => {
        const spyCalls = createSpy.getCalls().map(c => c.args[0])
        const status = spyCalls.map(c => c.status)
        const expectedStatus = new Array(11).fill('INVALID')
        expect(spyCalls).to.have.lengthOf(11)
        expect(status).to.deep.equal(expectedStatus)
      })
  })

  it('should trigger an update on the signer', async () => {
    return request(app.server)
      .post('/v1/webhooks/shufti/identity-verification')
      .send({ event: 'request.invalid', reference: '2e31d8c0-1226-4651-8a5d-4bd8aa454722', verification_result: mock.verificationAccepted.verification_result })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(() => {
        return knex.raw("SELECT * FROM signers WHERE id = '2e31d8c0-1226-4651-8a5d-4bd8aa454722' LIMIT 1")
          .then(r => {
            const signer = r.rows[0]
            const now = new Date()

            expect(signer.verification_status_face).to.equal('INVALID')
            expect(signer.verification_status_document).to.equal('INVALID')
            expect(signer.verification_status_address).to.equal('INVALID')

            // .toString() dates
            expect('' + signer.verification_status_face_updated_at).to.equal('' + now)
            expect('' + signer.verification_status_document_updated_at).to.equal('' + now)
            expect('' + signer.verification_status_address_updated_at).to.equal('' + now)
          })
      })
  })
})
