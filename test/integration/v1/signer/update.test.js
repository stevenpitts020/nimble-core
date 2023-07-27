const { uuid } = require('uuidv4')
const sinon = require('sinon')

describe('PUT /signers/:id', async () => {
  let defaultAccountRequestId, signer, FakeUpdateEnvelopeRecipients

  let clock

  before(async () => {
    nock.enable({ s3: true })
  })

  beforeEach(async () => {
    clock = sinon.useFakeTimers({ toFake: ['Date'] })

    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000020')
    await seed.document.create('a74f9092-5889-430a-9c19-6712f9f68090')
    // account request for prospect
    await seed.accountRequest.create('00000000-0000-AAAA-AAAA-000000000333')
    // create invited signers for this prospect with different roles and status
    // pending status
    await seed.signer.create('00000000-9999-aaaa-0000-2ea08a01e902')
    // invited status and secondary
    await seed.signer.create('00000000-9999-aaaa-0000-2ea08a01e901')
    // invited status and primary role
    await seed.signer.create('00000000-9999-aaaa-0000-2ea08a01e903')

    defaultAccountRequestId = '00000000-0000-AAAA-AAAA-000000000333'
    signer = {
      id: '00000000-9999-aaaa-0000-2ea08a01e903',
      firstName: 'John',
      middleName: 'MF',
      lastName: 'McClane',
      dateOfBirth: '1955-05-22T00:00:00.000Z',
      email: 'john.mf.mcclane@wearesingular.com',
      phoneNumber: '+1718-953-8465',
      address: '1381 Atlantic Ave, Brooklyn',
      city: 'New York',
      state: 'NY',
      zipCode: 'NY11216',
      ssn: '111-22-3333',
      employer: 'New York Police Dep.',
      consent: true,
      consentAccountOpening: true,
      consentPrivacyPolicy: true,
      consentCommunication: false,
      idProofDocument: {
        backDocumentId: 'a74f9092-5889-430a-9c19-6712f9f68090',
        frontDocumentId: 'a74f9092-5889-430a-9c19-6712f9f68090',
        type: 'USDL',
        number: '1231231230',
        issuer: 'WY',
        issuedDate: '2000-11-22T00:00:00.000Z',
        expirationDate: '2030-11-22T00:00:00.000Z'
      },
      selfieDocumentId: 'a74f9092-5889-430a-9c19-6712f9f68090'
    }

    FakeUpdateEnvelopeRecipients = sinon.replace(app.plugins.docusign, 'updateEnvelopeRecipients', sinon.fake.returns(Promise.resolve()))

    // fake set a contract id
    await knex('account_requests')
      .update('contract_document_envelope_id', 'CCCC00CC-BBBB-AAAA-AAAA-000000000CCC')
      .where('id', '00000000-0000-AAAA-AAAA-000000000333')
    // set state to INCOMPLETE simulating the end of adding signers
    await knex('account_requests').update('status', 'INCOMPLETE').where('id', '00000000-0000-AAAA-AAAA-000000000333')
  })

  afterEach(() => {
    clock.restore()
    sinon.restore()
    nock.cleanAll()
  })

  // helper for certain tests, creates an aproved account request
  async function seedAprovedAccountRequest() {
    const id = '00000000-0000-AAAA-AAAA-000000000444'
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d350')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.accountRequest.create(id)
    return id
  }

  function put(
    payload,
    signerId = '2e31d8c0-1226-4651-8a5d-4bd8aa454722'
  ) {
    const token = app.services.token.get({
      scopes: ['signers'],
      resources: [`signers#${signerId}`],
      expiration: 10
    })

    return request(app.server)
      .put(`/v1/signers/${signerId}`)
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect('Content-Type', /json/)
  }

  describe('when validating', () => {
    it('should complain about missing auth', async () => {
      return request(app.server)
        .put(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722`)
        .expect('Content-Type', /json/)
        .send({})
        .expect(401)
    })

    it('should complain if auth token is invalid', async () => {
      return request(app.server)
        .put(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722`)
        .set('Authorization', 'Bearer ' + 'AAAA')
        .send({})
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should complain if auth token is from the wrong signer', async () => {
      const token = app.services.token.get({
        scopes: ['signers'],
        resources: ['signers#00000000-0000-0000-0000-4bd8aa454722'],
        expiration: 10
      })

      return request(app.server)
        .put(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722`)
        .set('Authorization', 'Bearer ' + token)
        .send({})
        .expect('Content-Type', /json/)
        .expect(403)
    })

    it('should complain about bad selfieDocumentId', async () => {
      const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
      let data = Object.assign({}, signer, { selfieDocumentId: 'a74f9092-0000-0000-0000-000000000000' })

      return put(data, signerId)
        .expect(412)
        .expect(res => {
          expect(res.body.message).to.contain('Could not fetch the documents associated with this signer')
        })
    })

    it('should complain about bad idProofDocument document id', async () => {
      const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
      let data = Object.assign({}, signer)
      data.idProofDocument = {
        ...signer.idProofDocument,
        backDocumentId: 'a74f9092-0000-0000-0000-000000000000'
      }

      return put(data, signerId)
        .expect(412)
        .expect(res => {
          expect(res.body.message).to.contain('Could not fetch the documents associated with this signer')
        })
    })

    it('should complain about bad signer idProofDocument document type issuer relation', async () => {
      const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
      let data = Object.assign({}, signer)
      data.idProofDocument = {
        ...signer.idProofDocument,
        issuer: 'USA'
      }

      return put(data, signerId)
        .expect(400)
        .expect(res => {
          expect(res.body.message).to.contain('"idProofDocument.issuer" must be one of [AL, AK, AS')
        })
    })

    it('should 404 if signer does not exist', async () => {
      const signerId = uuid()
      return put(signer, signerId).expect(404)
    })

    it('should 412 if account request is not in a state that can be updated', async () => {
      const signerId = '00000000-0000-ACCC-0000-00BBBBBBB111'
      // create another account request totally unrelated
      await seedAprovedAccountRequest()
      // create a signer only related with that account
      await seed.signer.create(signerId)

      return put(signer, signerId.toLowerCase()).expect(412)
    })

    describe('if signer status is INVITED', () => {
      let signerId

      beforeEach(async () => {
        signerId = '00000000-9999-aaaa-0000-2ea08a01e902'
        await knex('signers').update('status', 'INVITED').where('id', signerId)
      })

      it('should keep state to "INVITED" when updating only internal data', async () => {
        const payload = {
          id: signer.id,
          consent: true
        }

        return put(payload, signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('INVITED')
          })
      })

      it('should change state to "INCOMPLETE" when updating some personal data', async () => {
        const payload = _.omit(signer, 'dateOfBirth')
        return put(payload, signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('INCOMPLETE')
          })
      })

      it('should change state to "PENDING" when updating all personal data', async () => {
        return put(signer, signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('PENDING')
          })
      })

      it('should change state to "PENDING" when partially updating all personal data', async () => {
        // signer already has firstName, lastName and email, so in the end it should have all personal data
        return put(_.omit(signer, 'firstName', 'lastName', 'email'), signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('PENDING')
          })
      })
    })

    describe('if signer status is INCOMPLETE', () => {
      let signerId

      beforeEach(async () => {
        signerId = '00000000-9999-aaaa-0000-2ea08a01e902'
        await knex('signers').update('status', 'INCOMPLETE').where('id', signerId)
      })

      it('should keep state to "INCOMPLETE" when updating only internal data', async () => {
        const payload = {
          id: signer.id,
          consent: true
        }

        return put(payload, signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('INCOMPLETE')
          })
      })

      it('should keep state to "INCOMPLETE" when updating some personal data', async () => {
        const payload = _.omit(signer, 'dateOfBirth')
        return put(payload, signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('INCOMPLETE')
          })
      })

      it('should change state to "PENDING" when updating all personal data', async () => {
        return put(signer, signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('PENDING')
          })
      })

      it('should change state to "PENDING" when partially updating all personal data', async () => {
        // signer already has firstName, lastName and email, so in the end it should have all personal data
        return put(_.omit(signer, 'firstName', 'lastName', 'email'), signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('PENDING')
          })
      })
    })

    describe('if signer status is PENDING', () => {
      let signerId

      beforeEach(async () => {
        signerId = '00000000-9999-aaaa-0000-2ea08a01e902'
        await knex('signers').update('status', 'PENDING').where('id', signerId)
      })

      it('should keep state to "PENDING" when updating internal data', async () => {
        const payload = {
          id: signer.id,
          consent: true
        }

        return put(payload, signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('PENDING')
          })
      })

      it('should keep state to "PENDING" when updating all personal data', async () => {
        return put(signer, signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('PENDING')
          })
      })

      it('should set state to "INCOMPLETE" when reseting some personal data', async () => {
        const payload = _.omit(signer, 'dateOfBirth')
        return put(payload, signerId)
          .expect(200)
          .then(res => {
            expect(res.body.status).to.equal('INCOMPLETE')
          })
      })
    })

    describe('if signer status is SIGNED', () => {
      let signerId

      beforeEach(async () => {
        signerId = '00000000-9999-aaaa-0000-2ea08a01e902'
        await knex('signers').update('status', 'SIGNED').where('id', signerId)
      })

      it('should return 412 when trying to update personal data', async () => {
        return put(signer, signerId).expect(412)
      })

      it('should return 200 when trying to update internal data', async () => {
        const payload = {
          id: signer.id,
          consent: true
        }
        return put(payload, signerId)
          .expect(200)
          .then(res => {
            expect(res.body.consent).to.equal(payload.consent)
          })
      })
    })
  })

  describe('when calling with valid data', () => {
    it('should return 200', () => {
      const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
      return put(signer, signerId).expect(200)
    })

    it('should return updated signer', () => {
      const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
      return put(signer, signerId)
        .expect(200)
        .then(res => {
          const expectedBody = _.omit(res.body, 'invitedAt', 'verificationStatus')
          const expectedResult = _.omit(blueprints.signers.signer_2, 'invitedAt', 'verificationStatus')
          expect(expectedBody).to.deep.equal(expectedResult)
        })
    })

    it('signer should be in PENDING status', async () => {
      const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
      return put(signer, signerId)
        .expect(200)
        .then(async res => {
          let target = await knex('signers')
            .where('email', res.body.email)
            .first()
          return expect(target.status).to.equal('PENDING')
        })
    })

    it('account request keep INCOMPLETE status when there are still invited signers', async () => {
      const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
      return put(signer, signerId)
        .expect(200)
        .then(async () => {
          let target = await knex('account_requests')
            .where('id', defaultAccountRequestId)
            .first()
          return expect(target.status).to.equal('INCOMPLETE')
        })
    })

    it('account request should be in PENDING status when all invited signers are onboarded', async () => {
      const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
      // let's progress the other signers
      await knex('signers')
        .update('status', 'PENDING')
        .where('id', '00000000-9999-aaaa-0000-2ea08a01e901')
      await knex('signers')
        .update('status', 'PENDING')
        .where('id', '00000000-9999-aaaa-0000-2ea08a01e902')

      return put(signer, signerId)
        .expect(200)
        .then(async () => {
          let target = await knex('account_requests')
            .where('id', defaultAccountRequestId)
            .first()
          return expect(target.status).to.equal('PENDING')
        })
    })

    it('account request should keep INCOMPLETE status when all invited signers are onboarded', async () => {
      const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
      // let's progress the other signers
      await knex('signers')
        .update('status', 'PENDING')
        .where('id', '00000000-9999-aaaa-0000-2ea08a01e901')
      await knex('signers')
        .update('status', 'PENDING')
        .where('id', '00000000-9999-aaaa-0000-2ea08a01e902')

      return put(_.omit(signer, 'firstName'), signerId)
        .expect(200)
        .then(async () => {
          let target = await knex('account_requests')
            .where('id', defaultAccountRequestId)
            .first()
          return expect(target.status).to.equal('INCOMPLETE')
        })
    })

    it('account request should keep DRAFT status despite all invited signers are onboarded', async () => {
      // set state to INCOMPLETE simulating the end of adding signers
      await knex('account_requests').update('status', 'DRAFT').where('id', '00000000-0000-AAAA-AAAA-000000000333')

      const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
      // let's progress the other signers
      await knex('signers')
        .update('status', 'PENDING')
        .where('id', '00000000-9999-aaaa-0000-2ea08a01e901')
      await knex('signers')
        .update('status', 'PENDING')
        .where('id', '00000000-9999-aaaa-0000-2ea08a01e902')

      return put(signer, signerId)
        .expect(200)
        .then(async () => {
          let target = await knex('account_requests')
            .where('id', defaultAccountRequestId)
            .first()
          return expect(target.status).to.equal('DRAFT')
        })
    })
  })

  describe('after the service execution', () => {
    const sleep = async ms => new Promise(resolve => setTimeout(resolve, ms))
    let eventPublishSpy

    beforeEach(() => {
      eventPublishSpy = sinon.replace(app.services.eventStream, 'publish', sinon.fake.returns(Promise.resolve()))
    })

    afterEach(() => {
      sinon.restore()
    })

    describe('trigger the creation of the documentation PDF', function () {
      it('should not trigger when updating signer internal data', async () => {
        const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
        const payload = {
          id: signer.id,
          consent: true
        }

        return put(payload, signerId)
          .expect(200)
          .then(async () => {
            await sleep(1) // wait for the async stuff
            expect(FakeUpdateEnvelopeRecipients).to.have.not.been.called
          })
      })

      it('should trigger when updating signer personal data', async () => {
        const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
        const payload = {
          id: signer.id,
          middleName: 'Justin'
        }
        return put(payload, signerId)
          .expect(200)
          .then(async () => {
            await sleep(1) // wait for the async stuff
            expect(FakeUpdateEnvelopeRecipients).to.have.been.calledOnce
            expect(FakeUpdateEnvelopeRecipients).to.have.been.calledWith(
              sinon.match.object,
              'CCCC00CC-BBBB-AAAA-AAAA-000000000CCC'
            )
          })
      })
    })

    describe('publish event', function () {
      it('should publish one signer update event when email is not updated', function () {
        const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
        return put(_.omit(signer, 'email'), signerId)
          .expect(200)
          .then(async () => {
            expect(eventPublishSpy).to.have.been.calledOnce
            const expected = eventPublishSpy.getCall(0).firstArg
            expect(expected).to.have.property('id', signerId)
            expect(expected).to.have.property('topicArn', 'arn:aws:sns:us-east-1:000000000000:core-tst-signers')
            expect(expected).to.have.property('event', 'signer_updated')
          })
      })

      it('should not publish signer update event when internal data is updated', function () {
        const signerId = '00000000-9999-aaaa-0000-2ea08a01e903'
        const payload = {
          id: signer.id,
          consent: true
        }

        return put(payload, signerId)
          .expect(200)
          .then(async () => {
            expect(eventPublishSpy).to.have.not.been.called
          })
      })
    })
  })
})
