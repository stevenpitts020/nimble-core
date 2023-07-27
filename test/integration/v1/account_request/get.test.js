describe('GET /account-requests/:id', () => {
  const accountRequestId = '2552ab85-08da-4bb5-be00-9e94d282d348'
  let clock

  before(() => {
    clock = sinon.useFakeTimers({ toFake: ['Date'] })
  })

  after(() => {
    clock.restore()
  })

  beforeEach(async () => {
    await seed.institution.create()
    await seed.institutionBranch.create()
    await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d310')
    await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d340') // required by seed.account_request_products
    await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d360') // required by seed.account_request_products
    await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d312')
    await seed.product_options()
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d360') // required by seed.accountRequest
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.document.create()
    await seed.accountRequest.create(accountRequestId)
    await seed.accountRequest.create('17ba2033-1c12-463b-bbc7-72deed747ae7') // required by seed.account_request_products
    await seed.accountRequest.create('da31cf6d-f10c-43a1-a67e-e80ad124c223') // required by seed.account_request_products
    await seed.accountRequest.create('17ba2033-1c12-463b-bbc7-72deed747ae8')
    await seed.account_request_products() // insert all
    await seed.account_request_product_options() // insert all
    await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
    await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454721')
  })

  describe('Token', () => {
    function getToken(accountRequestId) {
      return app.services.token.get({
        scopes: ['account_requests'],
        resources: [`account_requests#${accountRequestId}`],
        expiration: 10
      })
    }

    describe('when validating token', () => {
      it('should complain about missing auth', async () => {
        return request(app.server)
          .get(`/v1/account-requests/${accountRequestId}`)
          .expect('Content-Type', /json/)
          .expect(401)
      })

      it('should complain if auth token is invalid', async () => {
        return request(app.server)
          .get(`/v1/account-requests/${accountRequestId}`)
          .set('Authorization', 'Bearer ' + 'AAAA')
          .expect('Content-Type', /json/)
          .expect(401)
      })

      it('should complain if auth token is from the wrong account request', async () => {
        const token = getToken('00000000-0000-0000-0000-4bd8aa454722')

        return request(app.server)
          .get(`/v1/account-requests/2552ab85-08da-4bb5-be00-9e94d282d348`)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(403)
      })
    })

    describe('when validating', () => {
      it('should return 404 if not found', done => {
        const token = getToken('343eeab1-5c67-485d-8822-807a3f695d73')
        request(app.server)
          .get('/v1/account-requests/343eeab1-5c67-485d-8822-807a3f695d73')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(404)
          .end(done)
      })

      it('should return 401 if id is not a propper uuid', () => {
        const token = getToken(accountRequestId)
        return request(app.server)
          .get('/v1/account-requests/123')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(401)
      })
    })

    describe('when calling with valid data', () => {
      it('should return 200', () => {
        const token = getToken(accountRequestId)
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
      })

      it('should return valid account request object', (done) => {
        const token = getToken(accountRequestId)
        request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            // prop check
            let props = [
              'id',
              'status',
              'signers',
              'createdAt',
              'contractDocumentEnvelopeStatus',
              'contractDocumentCreatedAt',
              'contractDocumentEnvelopeStatusUpdatedAt'
            ]

            props.forEach(prop => {
              expect(res.body).to.have.own.property(prop)
            })

            // type check
            expect(res.body.id).to.be.an('string')
            expect(res.body.status).to.be.an('string')
            expect(res.body.signers).to.be.an('array')
            expect(res.body.createdAt).to.be.an('string')
            expect(res.body.contractDocumentEnvelopeStatus).to.be.an('string')
            expect(res.body.contractDocumentCreatedAt).to.be.an('string')
            expect(res.body.contractDocumentEnvelopeStatusUpdatedAt).to.be.an('string')
            done()
          })
      })

      it('should return correct account request object', () => {
        const token = getToken(accountRequestId)
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body).to.deep.equal(blueprints.accountRequest.get(accountRequestId))
          })
      })

      it('should return correct account request with signers order by role', () => {
        const token = getToken(accountRequestId)
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body.signers[0].role).to.deep.equal('PRIMARY')
          })
      })

      it('should return account requests with options', () => {
        const accountRequestId2 = '17ba2033-1c12-463b-bbc7-72deed747ae7'
        const token = getToken(accountRequestId2)
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId2)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body.productConfigurations[0].product.options).to.have.length(2)
          })
      })

      it('should return account request with multiple products with options', () => {
        const accountRequestId3 = '17ba2033-1c12-463b-bbc7-72deed747ae8'
        const token = getToken(accountRequestId3)
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId3)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body).to.deep.equal(blueprints.accountRequest.get(accountRequestId3))
          })
      })

      it('should return account requests without signers', () => {
        const accountRequestId2 = '17ba2033-1c12-463b-bbc7-72deed747ae7'
        const token = getToken(accountRequestId2)
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId2)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body).to.deep.equal(blueprints.accountRequest.get(accountRequestId2))
          })
      })

      it('should return correct account request verification status based on signers', () => {
        const token = getToken(accountRequestId)
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const verification = res.body.verificationStatus

            expect(verification.faceStatus).to.be.equal('VALID')
            expect(verification.documentStatus).to.be.equal('INVALID')
            expect(verification.addressStatus).to.be.equal('INVALID')
            expect(verification.sanctionsStatus).to.be.equal('MATCH')
            expect(verification.mediaStatus).to.be.equal('MATCH')
            expect(verification.politicalExposure).to.be.equal('MATCH')
          })
      })

      it('should return pending account request verification status based on signers', async () => {
        await seed.signer.create('ef3c30f8-fb32-4d1f-9fd9-211637ab1111')

        const token = getToken(accountRequestId)
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const verification = res.body.verificationStatus

            expect(verification.addressStatus).to.be.equal('PENDING')
            expect(verification.documentStatus).to.be.equal('PENDING')
            expect(verification.faceStatus).to.be.equal('PENDING')
            expect(verification.sanctionsStatus).to.be.equal('PENDING')
            expect(verification.mediaStatus).to.be.equal('PENDING')
            expect(verification.politicalExposure).to.be.equal('PENDING')
          })
      })
    })
  })

  describe('AuthToken', () => {
    let token

    beforeEach(async () => {
      token = await helpers.getAuthToken('1052ab85-08da-4bb5-be00-9e94d282d310')
    })

    describe('with invalid auth', () => {
      it('should return 401 if no auth', done => {
        request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .expect('Content-Type', /json/)
          .expect(401)
          .end(done)
      })

      it('should return 401 if bad auth', done => {
        request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .expect('Content-Type', /json/)
          .set('Authorization', 'Bearer ' + 'AAAA')
          .expect(401)
          .end(done)
      })
    })

    describe('when validating', () => {
      it('should return 404 if not found', done => {
        request(app.server)
          .get('/v1/account-requests/343eeab1-5c67-485d-8822-807a3f695d73')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(404)
          .end(done)
      })

      it('should return 404 if user does not belong to institution', async () => {
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d350')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d350')
        const badToken = await helpers.getAuthToken('1052ab85-08da-4bb5-be00-9e94d282d350')
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + badToken)
          .expect('Content-Type', /json/)
          .expect(404)
      })

      it('should return 400 if id is not a propper uuid', done => {
        request(app.server)
          .get('/v1/account-requests/123')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(400)
          .end((err, res) => {
            expect(res.body.message).to.contain('"id" must be a valid GUID')
            done()
          })
      })
    })

    describe('when calling with valid data', () => {
      it('should return 200', done => {
        request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(done)
      })

      it('should return valid account request object', done => {
        request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            // prop check
            let props = [
              'id',
              'status',
              'signers',
              'createdAt',
              'contractDocumentEnvelopeStatus',
              'contractDocumentCreatedAt',
              'contractDocumentEnvelopeStatusUpdatedAt'
            ]

            props.forEach(prop => {
              expect(res.body).to.have.own.property(prop)
            })

            // type check
            expect(res.body.id).to.be.an('string')
            expect(res.body.status).to.be.an('string')
            expect(res.body.signers).to.be.an('array')
            expect(res.body.createdAt).to.be.an('string')
            expect(res.body.contractDocumentEnvelopeStatus).to.be.an('string')
            expect(res.body.contractDocumentCreatedAt).to.be.an('string')
            expect(res.body.contractDocumentEnvelopeStatusUpdatedAt).to.be.an('string')
            done()
          })
      })

      it('should return correct account request object', () => {
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body).to.deep.equal(blueprints.accountRequest.get(accountRequestId))
          })
      })

      it('should return correct account request with signers order by role', () => {
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body.signers[0].role).to.deep.equal('PRIMARY')
          })
      })

      it('should return account requests with options', async () => {
        const accountRequestId2 = '17ba2033-1c12-463b-bbc7-72deed747ae7'
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId2)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body.productConfigurations[0].product.options).to.have.length(2)
          })
      })

      it('should return account request with multiple products with options', async () => {
        const accountRequestId3 = '17ba2033-1c12-463b-bbc7-72deed747ae8'
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId3)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body).to.deep.equal(blueprints.accountRequest.get(accountRequestId3))
          })
      })

      it('should return account requests without signers', async () => {
        const accountRequestId2 = '17ba2033-1c12-463b-bbc7-72deed747ae7'
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId2)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body).to.deep.equal(blueprints.accountRequest.get(accountRequestId2))
          })
      })

      it('should return correct account request verification status based on signers', async () => {
        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const verification = res.body.verificationStatus

            expect(verification.faceStatus).to.be.equal('VALID')
            expect(verification.documentStatus).to.be.equal('INVALID')
            expect(verification.addressStatus).to.be.equal('INVALID')
            expect(verification.sanctionsStatus).to.be.equal('MATCH')
            expect(verification.mediaStatus).to.be.equal('MATCH')
            expect(verification.politicalExposure).to.be.equal('MATCH')
          })
      })

      it('should return pending account request verification status based on signers', async () => {
        await seed.signer.create('ef3c30f8-fb32-4d1f-9fd9-211637ab1111')

        return request(app.server)
          .get('/v1/account-requests/' + accountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const verification = res.body.verificationStatus

            expect(verification.addressStatus).to.be.equal('PENDING')
            expect(verification.documentStatus).to.be.equal('PENDING')
            expect(verification.faceStatus).to.be.equal('PENDING')
            expect(verification.sanctionsStatus).to.be.equal('PENDING')
            expect(verification.mediaStatus).to.be.equal('PENDING')
            expect(verification.politicalExposure).to.be.equal('PENDING')
          })
      })
    })
  })
})
