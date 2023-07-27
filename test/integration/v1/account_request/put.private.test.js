const sinon = require('sinon')

describe('PUT private /account-requests/:id', () => {
  const pendingAccountRequestId = '17ba2033-1c12-463b-bbc7-72deed747ae7'
  const putRequest = {
    status: 'APPROVED',
    branchId: '2552ab85-0000-0000-0000-000000000001',
    statusEmailSubject: 'example subject',
    statusEmailBody: '<html>example body</html>',
  }

  describe('with invalid JWT auth', () => {
    it('should return 401 if no auth', done => {
      request(app.server)
        .put('/v1/account-requests/' + pendingAccountRequestId)
        .expect('Content-Type', /json/)
        .send(putRequest)
        .expect(401)
        .end(done)
    })

    it('should return 401 if bad auth', done => {
      request(app.server)
        .put('/v1/account-requests/' + pendingAccountRequestId)
        .set('Authorization', 'Bearer ' + 'invalid')
        .expect('Content-Type', /json/)
        .send(putRequest)
        .expect(401)
        .end(done)
    })


  })

  describe('with valid JWT auth', () => {
    let token
    const fakeAccountRequestId = 'ANOTHER-0000-0000-0000-UUID'
    const aprovedAccountRequestId = '2552ab85-08da-4bb5-be00-9e94d282d348'

    beforeEach(async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.document.create()
      await seed.accountRequest.create(pendingAccountRequestId)
      await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454723')

      token = await helpers.getAuthToken()
    })

    describe('when the state is not SIGNED', () => {
      it('should return 403 if changed to approved wen not signed', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send(putRequest)
          .expect(403)
          .end((err, res) => {
            expect(res.body.message).to.contain('Status can only be changed to APROVED if it was previously SIGNED')
            done()
          })
      })

      it('should return 200 if changed to declined wen not signed', done => {
        const putRequestDeclined = {
          status: 'DECLINED',
          statusEmailSubject: 'example subject',
          statusEmailBody: '<html>example body</html>',
        }

        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send(putRequestDeclined)
          .expect(200)
          .end(done)
      })
    })

    describe('when the state is SIGNED', () => {
      let emailSpy
      let eventPublishSpy

      beforeEach(async () => {
        emailSpy = sinon.spy(app.plugins.email, 'sendAccountRequestStatus')
        eventPublishSpy = sinon.replace(app.services.eventStream, 'publish', sinon.fake.returns(Promise.resolve()))
        await knex('account_requests').update('status', 'SIGNED').where('id', pendingAccountRequestId)
      })

      afterEach(async () => {
        emailSpy.restore()
        sinon.restore()
      })

      it('should return 200', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send(putRequest)
          .expect(200)
          .end(done)
      })

      it('should return 404 if not found', done => {
        request(app.server)
          .put('/v1/account-requests/343eeab1-5c67-485d-8822-807a3f695d73')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send(putRequest)
          .expect(404)
          .end(done)
      })

      it('should return 404 if user does not belong to intitution', async () => {
        await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
        await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000020')
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d350')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d350')
        const badToken = await helpers.getAuthToken('1052ab85-08da-4bb5-be00-9e94d282d350')

        return request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + badToken)
          .expect('Content-Type', /json/)
          .send(putRequest)
          .expect(404)
      })

      it('should return 400 if id is not a propper uuid', done => {
        request(app.server)
          .put('/v1/account-requests/123')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send(putRequest)
          .expect(400)
          .end((err, res) => {
            expect(res.body.message).to.contain('"id" must be a valid GUID')
            done()
          })
      })

      it('should return valid account request object', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send(putRequest)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            // prop check
            let props = ['id', 'status', 'signers', 'statusEmailSubject', 'statusEmailBody', 'statusUpdatedBy', 'statusUpdatedAt', 'createdAt']
            props.forEach(prop => {
              expect(res.body).to.have.own.property(prop)
            })

            // type check
            expect(res.body.id).to.be.an('string')
            expect(res.body.status).to.be.an('string')
            expect(res.body.statusEmailSubject).to.be.an('string')
            expect(res.body.statusEmailBody).to.be.an('string')
            expect(res.body.signers).to.be.an('array')
            expect(res.body.createdAt).to.be.an('string')
            expect(res.body.statusUpdatedBy).to.be.an('object')
            expect(res.body.statusUpdatedAt).to.be.an('string')
            done()
          })
      })

      it('should return updated account request object', done => {
        const expectedStatusUpdatedBy = {
          id: '1052ab85-08da-4bb5-be00-9e94d282d310',
          firstName: 'Test',
          lastName: 'User',
          createdAt: '2018-02-16T12:32:03.341Z',
          email: 'demouser@nimblefi.com',
          roles: ['employee'],
          status: 'ACTIVE',
          phone: null,
          _refLink: 'http://localhost:3001/wearesingular.com/onboarding/?_rbid=1052ab85-08da-4bb5-be00-9e94d282d310'
        }

        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send(putRequest)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body.id).to.equal(pendingAccountRequestId)
            expect(res.body.status).to.equal(putRequest.status)
            expect(res.body.statusEmailBody).to.equal(putRequest.statusEmailBody)
            expect(res.body.statusEmailSubject).to.equal(putRequest.statusEmailSubject)
            expect(res.body.statusUpdatedBy).to.deep.equal(expectedStatusUpdatedBy)
            expect(moment.utc(res.body.statusUpdatedAt).unix()).to.be.closeTo(moment.utc().unix(), 2) // within 2 secconds
            done()
          })
      })

      it('should complain about missing fields', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send({})
          .expect(400)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body.message).to.contain('"status" is required')
            expect(res.body.message).to.contain('"statusEmailSubject" is required')
            expect(res.body.message).to.contain('"statusEmailBody" is required')
            done()
          })
      })

      it('should complain about invalid status field', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send({ ...putRequest, status: 'INVALID' })
          .expect(400)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body.message).to.contain('"status" must be one of [APPROVED, DECLINED]')
            done()
          })
      })

      it('should complain about non described fields', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send({ ...putRequest, somethingElse: 'not allowed' })
          .expect(400)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body.message).to.contain('not allowed')
            done()
          })
      })

      it('should not allow to update write-only fields', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send({ ...putRequest, createdAt: 123123123 })
          .expect(400)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body.message).to.contain('"createdAt" is not allowed')
            done()
          })
      })

      it('should not allow to overwrite internal properties', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send({ ...putRequest, id: fakeAccountRequestId })
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body.id).not.to.equal(fakeAccountRequestId)
            done()
          })
      })

      it('should trigger queue message', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send({ ...putRequest, status: 'APPROVED' })
          .expect(200)
          .end((err) => {
            if (err) throw new Error(err)
            expect(eventPublishSpy).to.have.been.calledOnce
            const expected = eventPublishSpy.getCall(0).firstArg
            expect(expected).to.have.property('id', pendingAccountRequestId.toUpperCase())
            expect(expected).to.have.property('topicArn', 'arn:aws:sns:us-east-1:000000000000:core-tst-account-requests')
            expect(expected).to.have.property('event', 'account_request_approved')
            done()
          })
      })

      it('should send APPROVED email', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send({ ...putRequest, status: 'APPROVED' })
          .expect(200)
          .end((err) => {
            if (err) throw new Error(err)

            expect(emailSpy.callCount).to.equal(1)
            expect(emailSpy.getCall(0).args[0]).to.equal('APPROVED')
            expect(emailSpy.getCall(0).args[1].statusEmailSubject).to.equal(putRequest.statusEmailSubject)
            expect(emailSpy.getCall(0).args[1].statusEmailBody).to.equal(putRequest.statusEmailBody)
            expect(emailSpy.getCall(0).args[1].email).to.equal('someone@nimblefi.com')
            expect(emailSpy.getCall(0).args[1].cc).to.equal('demouser@nimblefi.com')
            done()
          })
      })

      // Temporarily removed in issue #73
      it.skip('should send DECLINED email', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send({ ...putRequest, status: 'DECLINED' })
          .expect(200)
          .end((err) => {
            if (err) throw new Error(err)

            expect(emailSpy.callCount).to.equal(1)
            expect(emailSpy.getCall(0).args[0]).to.equal('DECLINED')
            expect(emailSpy.getCall(0).args[1].statusEmailSubject).to.equal(putRequest.statusEmailSubject)
            expect(emailSpy.getCall(0).args[1].statusEmailBody).to.equal(putRequest.statusEmailBody)
            expect(emailSpy.getCall(0).args[1].email).to.equal('someone@nimblefi.com')
            expect(emailSpy.getCall(0).args[1].cc).to.equal('userfromotherbank@nimblefi.com')
            done()
          })
      })

      it('should use breaklines in emails', done => {
        request(app.server)
          .put('/v1/account-requests/' + pendingAccountRequestId)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .send({ ...putRequest, status: 'APPROVED', statusEmailBody: "something \n something else \n third thing" })
          .expect(200)
          .end((err) => {
            if (err) throw new Error(err)

            expect(emailSpy.callCount).to.equal(1)
            expect(emailSpy.getCall(0).args[0]).to.equal('APPROVED')
            expect(emailSpy.getCall(0).args[1].statusEmailSubject).to.equal(putRequest.statusEmailSubject)
            expect(emailSpy.getCall(0).args[1].statusEmailBody).to.equal("something <br/> something else <br/> third thing")
            expect(emailSpy.getCall(0).args[1].email).to.equal('someone@nimblefi.com')
            expect(emailSpy.getCall(0).args[1].cc).to.equal('demouser@nimblefi.com')
            done()
          })
      })

      describe('when the user does not have the email verified', () => {
        beforeEach(async () => {
          await knex('signers').update('email_verified', 'false').where('id', '2e31d8c0-1226-4651-8a5d-4bd8aa454723')
        })

        it('should not send APPROVED email', done => {
          request(app.server)
            .put('/v1/account-requests/' + pendingAccountRequestId)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .send({ ...putRequest, status: 'APPROVED' })
            .expect(200)
            .end((err) => {
              if (err) throw new Error(err)

              expect(emailSpy.callCount).to.equal(0)
              done()
            })
        })

        it('should not send DECLINED email', done => {
          const putRequestDeclined = {
            status: 'DECLINED',
            statusEmailSubject: 'example subject',
            statusEmailBody: '<html>example body</html>',
          }
          request(app.server)
            .put('/v1/account-requests/' + pendingAccountRequestId)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .send(putRequestDeclined)
            .expect(200)
            .end((err) => {
              if (err) throw new Error(err)

              expect(emailSpy.callCount).to.equal(0)
              done()
            })
        })
      })

      describe('when aproving or declining an Account Request', () => {
        beforeEach(async () => {
          await seed.accountRequest.create(aprovedAccountRequestId)
        })

        it('should return 403 if already approved', done => {
          request(app.server)
            .put('/v1/account-requests/' + aprovedAccountRequestId)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .send(putRequest)
            .expect(403)
            .end((err, res) => {
              expect(res.body.message).to.contain('Status can not be changed if it was previously APPROVED')
              done()
            })
        })

        it('should return 200 if not trying to revert to pending', done => {
          request(app.server)
            .put('/v1/account-requests/' + aprovedAccountRequestId)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .send({ ...putRequest, status: 'PENDING' })
            .expect(403)
            .end((err, res) => {
              expect(res.body.message).to.contain('"status" must be one of [APPROVED, DECLINED]')
              done()
            })
        })
      })
    })
  })
})
