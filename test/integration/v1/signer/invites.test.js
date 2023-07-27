const uuid = require('uuid')

describe('POST /signers/:id/invites', async () => {
  let clock, token, inviteSignerEmailSpy

  before(async () => {
    inviteSignerEmailSpy = sinon.spy(app.services.email, 'inviteReminder')
    clock = sinon.useFakeTimers({
      toFake: ['Date']
    })
  })

  after(() => {
    sinon.restore()
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
    token = await helpers.getAuthToken()
  })

  describe('with invalid auth', () => {
    it('should return 401 if no auth', async () => {
      return request(app.server)
        .post(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/invites`)
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should return 401 if bad auth', async () => {
      return request(app.server)
        .post(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/invites`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + "AAAA")
        .expect(401)
    })
  })

  it('should return 400 with invalid uuid as id', async () => {
    const id = 'invalid-uuid-here'
    return request(app.server)
      .post(`/v1/signers/${id}/invites`)
      .expect('Content-Type', /json/)
      .set('Authorization', 'Bearer ' + token)
      .expect(400)
  })

  it('should return 404 with random uuid', async () => {
    const id = uuid.v4()
    return request(app.server)
      .post(`/v1/signers/${id}/invites`)
      .expect('Content-Type', /json/)
      .set('Authorization', 'Bearer ' + token)
      .expect(404)
  })

  it('should return 201', async () => {
    return request(app.server)
      .post(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/invites`)
      .expect('Content-Type', /json/)
      .set('Authorization', 'Bearer ' + token)
      .expect(201)
  })

  it('should trigger an email to the signer', async () => {
    return request(app.server)
      .post(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/invites`)
      .expect('Content-Type', /json/)
      .set('Authorization', 'Bearer ' + token)
      .expect(201)
      .then(() => {
        expect(inviteSignerEmailSpy).to.have.been.calledWith('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
      })
  })
})
