const sinon = require('sinon')

describe('POST /signers/:id/validate', async () => {
  let defaultAccountRequestId, signer

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
      selfieDocumentId: 'a74f9092-5889-430a-9c19-6712f9f68090'
    }

    // update primary signer with default data
    await knex('signers')
      .update('ssn', '111-22-3333')
      .update('phone_number', '+1718-953-8465')
      .where('id', signer.id)

    // update another signer with test data
    await knex('signers')
      .update('ssn', '000-11-2222')
      .update('phone_number', '+1123-456-7890')
      .where('id', '00000000-9999-aaaa-0000-2ea08a01e901')

    // set state to INCOMPLETE simulating the end of adding signers
    await knex('account_requests').update('status', 'INCOMPLETE').where('id', '00000000-0000-AAAA-AAAA-000000000333')
  })

  afterEach(() => {
    clock.restore()
    sinon.restore()
    nock.cleanAll()
  })

  function post(
    payload,
    signerId = '00000000-9999-aaaa-0000-2ea08a01e902'
  ) {

    return request(app.server)
      .post(`/v1/signers/${signerId}/validate`)
      .send(payload)
      .expect('Content-Type', /json/)
  }

  describe('when validating', () => {
    describe('it should detect duplicate SSNs and/or phone numbers', async () => {
      let payload
      let signerId = '00000000-9999-aaaa-0000-2ea08a01e902'

      beforeEach(() => {
        // Note: id and accountRequestId are key required fields for this API endpoint
        payload = _.clone(signer)
        payload.id = signerId
        payload.accountRequestId = defaultAccountRequestId
      })

      it ('should 409 if duplicate SSN', async () => {
        payload.ssn = '111-22-3333'
        payload.phoneNumber = '+1813-444-2222'

        return post(payload, signerId)
          .expect(409)
          .then(res => {
            expect(res.body).to.have.property(signerId)
            expect(res.body[signerId]).to.have.property('ssn')
            expect(res.body[signerId].ssn).to.have.property('message')
          })
      })

      it ('should 409 if duplicate phone number', async () => {
        payload.ssn = '123-45-6789'
        payload.phoneNumber = '+1718-953-8465'
        return post(payload, signerId)
          .expect(409)
          .then(res => {
            expect(res.body).to.have.property(signerId)
            expect(res.body[signerId]).to.have.property('phoneNumber')
            expect(res.body[signerId].phoneNumber).to.have.property('message')
          })
      })

      it ('should 409 if duplicate ssn and phone number', async () => {
        return post(payload, signerId)
          .expect(409)
          .then(res => {
            expect(res.body).to.have.property(signerId)
            expect(res.body[signerId]).to.have.property('ssn')
            expect(res.body[signerId].ssn).to.have.property('message')
            expect(res.body[signerId]).to.have.property('phoneNumber')
            expect(res.body[signerId].phoneNumber).to.have.property('message')
          })
      })

      it ('should 409 if duplicate ssn of another non-primary signer', async () => {
        payload.ssn = '000-11-2222'
        return post(payload, signerId)
          .expect(409)
          .then(res => {
            expect(res.body).to.have.property(signerId)
            expect(res.body[signerId]).to.have.property('ssn')
            expect(res.body[signerId].ssn).to.have.property('message')
            expect(res.body[signerId].ssn.message.startsWith('<firstName> [00000000-9999-aaaa-0000-2ea08a01e901] cannot share the same SSN')).to.be.true
          })
      })

      it ('should 409 if duplicate phone number of another non-primary signer', async () => {
        payload.phoneNumber = '+1123-456-7890'
        return post(payload, signerId)
          .expect(409)
          .then(res => {
            expect(res.body).to.have.property(signerId)
            expect(res.body[signerId]).to.have.property('phoneNumber')
            expect(res.body[signerId].phoneNumber).to.have.property('message')
            expect(res.body[signerId].phoneNumber.message.startsWith('<firstName> [00000000-9999-aaaa-0000-2ea08a01e901] cannot share the same phone number')).to.be.true
          })
      })

      it ('should succeed when both SSN and phone number are unique across all signers', async () => {
        payload.ssn = '999-88-7777'
        payload.phoneNumber = '+1444-444-4444'
        return post(payload, signerId)
          .expect(200)
          .then(res => {
            expect(res.body).to.be.equal('')
          })
      })
    })
  })
})
