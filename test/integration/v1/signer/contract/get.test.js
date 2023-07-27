describe('GET /signers/:id/contract', async () => {
  let FakeCreateRecipientView, clock, token

  before(() => {
    FakeCreateRecipientView = sinon.fake.returns('http://contract.url')
    sinon.replace(app.plugins.docusign, 'createRecipientView', FakeCreateRecipientView)

    token = app.services.token.get({
      scopes: ['signers'],
      resources: [
        `signers#00000000-9999-aaaa-0000-2ea08a01e901`,
        `signers#00000000-9999-aaaa-0000-2ea08a01e902`,
        `signers#00000000-9999-aaaa-0000-2ea08a01e903`,
      ],
      expiration: 1200
    })

    clock = sinon.useFakeTimers({ toFake: ['Date'] })
    nock.enable()
  })

  after(() => {
    sinon.restore()
    clock.restore()
    nock.enableNetConnect()
  })

  afterEach(() => {
    sinon.reset()
    nock.cleanAll()
  })

  beforeEach(async () => {
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
    await seed.document.create('a74f9092-5889-430a-9c19-6712f9f68090')
    await seed.productAccountNumber.create()

    // product with options
    await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d340')
    await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d310')
    await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d311')
    await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d312')


    // account request for prospect
    await seed.accountRequest.create('00000000-0000-AAAA-AAAA-000000000333')
    // create invited signers for this prospect with different roles and status
    // pending status
    await seed.signer.create('00000000-9999-aaaa-0000-2ea08a01e902')
    // invited status and secondary
    await seed.signer.create('00000000-9999-aaaa-0000-2ea08a01e901')
    // invited status and primary role
    await seed.signer.create('00000000-9999-aaaa-0000-2ea08a01e903')

    // fake set a contract id
    await knex('account_requests')
      .update('contract_document_envelope_id', 'CCCC00CC-BBBB-AAAA-AAAA-000000000CCC')
      .where('id', '00000000-0000-AAAA-AAAA-000000000333')
  })


  describe('when validating', () => {
    it('should return 403 when the token does not provide access to that signer', async () => {
      let badtoken = app.services.token.get({
        scopes: ['signers'],
        resources: [
          // `signers#00000000-9999-aaaa-0000-2ea08a01e901`, <--- removing this ID from the list
          `signers#00000000-9999-aaaa-0000-2ea08a01e902`,
          `signers#00000000-9999-aaaa-0000-2ea08a01e903`,
        ],
        expiration: 10
      })

      return request(app.server)
        .get(`/v1/signers/00000000-9999-aaaa-0000-2ea08a01e901/contract`)
        .set('Authorization', 'Bearer ' + badtoken)
        .expect(403)
        .expect('Content-Type', /json/)
    })
    it('should return 401 when the token is invalid', async () => {
      return request(app.server)
        .get(`/v1/signers/00000000-9999-aaaa-0000-2ea08a01e901/contract`)
        .set('Authorization', 'Bearer ' + 'AAAAA')
        .expect(401)
        .expect('Content-Type', /json/)
    })


    it('should return 400 when the token is missing', async () => {
      return request(app.server)
        .get(`/v1/signers/00000000-9999-aaaa-0000-2ea08a01e901/contract`)
        .expect(401)
        .expect('Content-Type', /json/)
    })

    it('should return 401 if sending bad signer.id', async () => {
      let weirdtoken = app.services.token.get({
        scopes: ['signers'],
        resources: [
          `signers#invalid`,
        ],
        expiration: 10
      })

      return request(app.server)
        .get(`/v1/signers/invalid/contract`)
        .set('Authorization', 'Bearer ' + weirdtoken)
        .expect(401)
        .expect('Content-Type', /json/)
    })
    it('should return 404 if sending missing Signer', async () => {
      let weirdtoken = app.services.token.get({
        scopes: ['signers'],
        resources: [
          `signers#00000000-9999-aaaa-0000-2ea08a01e909`,
        ],
        expiration: 10
      })

      return request(app.server)
        .get(`/v1/signers/00000000-9999-aaaa-0000-2ea08a01e909/contract`)
        .set('Authorization', 'Bearer ' + weirdtoken)
        .expect(404)
        .expect('Content-Type', /json/)
    })
  })

  describe('when called with valid data', () => {
    it('should return 200', async () => {
      return request(app.server)
        .get(`/v1/signers/00000000-9999-aaaa-0000-2ea08a01e901/contract`)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/)
    })

    it('should call the docusign embed() service', async () => {
      return request(app.server)
        .get(`/v1/signers/00000000-9999-aaaa-0000-2ea08a01e901/contract`)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(() => {
          // expect call parameters
          expect(FakeCreateRecipientView).to.have.been.calledWith(
            'CCCC00CC-BBBB-AAAA-AAAA-000000000CCC',
            sinon.match.object
              .and(sinon.match.has("accountRequestId"))
              .and(sinon.match.has("id")),
            'testbank.wearesingular.com'
          )

          const expectedSignerId = FakeCreateRecipientView.firstCall.args[1].id
          const expectedAccountRequestId = FakeCreateRecipientView.firstCall.args[1].accountRequestId

          // expect correct IDs
          expect(expectedSignerId).to.equal('00000000-9999-aaaa-0000-2ea08a01e901')
          expect(expectedAccountRequestId).to.equal('00000000-0000-aaaa-aaaa-000000000333')
          return true
        })
    })

    it('should return an object with the expected schema', async () => {
      return request(app.server)
        .get(`/v1/signers/00000000-9999-aaaa-0000-2ea08a01e901/contract`)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).to.have.ownProperty('url')
          expect(res.body).to.have.ownProperty('expiresAt')
        })
    })

    it('should return an object with the expected values', async () => {
      return request(app.server)
        .get(`/v1/signers/00000000-9999-aaaa-0000-2ea08a01e901/contract`)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body.url).to.equal('http://contract.url')
          expect(res.body.expiresAt).to.equal('1970-01-01T00:05:00.000Z') // now() + 5 minutes
        })
    })
  })
})
