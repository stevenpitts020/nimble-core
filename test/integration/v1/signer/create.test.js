const _ = require('lodash')

describe('POST /signers', async () => {
  const sleep = async ms => new Promise(resolve => setTimeout(resolve, ms))
  let clock,
    newSigner,
    inviteSignerEmailSpy,
    eventPublishSpy,
    verifyEmailSpy

  before(() => {
    nock.enable()
    verifyEmailSpy = sinon.replace(app.services.email, 'emailVerification', sinon.fake.returns(Promise.resolve()))
    inviteSignerEmailSpy = sinon.replace(app.services.email, 'inviteSigner', sinon.fake.returns(Promise.resolve()))
    eventPublishSpy = sinon.replace(app.services.eventStream, 'publish', sinon.fake.returns(Promise.resolve()))
  })

  after(() => {
    sinon.restore()
    nock.enableNetConnect()
  })

  beforeEach(async () => {
    clock = sinon.useFakeTimers({ toFake: ['Date'] })

    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
    await seed.document.create('a74f9092-5889-430a-9c19-6712f9f68090')
    await seed.productAccountNumber.create()
    // account request
    await seed.accountRequest.create('00000000-0000-AAAA-AAAA-000000000333')

    newSigner = {
      accountRequestId: '00000000-0000-AAAA-AAAA-000000000333',
      role: 'PRIMARY',
      firstName: 'John',
      middleName: 'MF',
      lastName: 'McClane',
      dateOfBirth: '1955-05-22T00:00:00.000Z',
      email: 'john.mf.mcclane@wearesingular.com',
      phoneNumber: '+1718-953-8465',
      address: '1381 Atlantic Ave, Brooklyn',
      employer: 'New York Police Dep.',
      city: 'New York',
      state: 'NY',
      zipCode: 'NY11216',
      ssn: '111-22-3333',
      consent: true,
      consentAccountOpening: true,
      consentPrivacyPolicy: true,
      consentCommunication: false,
      idProofDocument: {
        backDocumentId: 'a74f9092-5889-430a-9c19-6712f9f68090',
        frontDocumentId: 'a74f9092-5889-430a-9c19-6712f9f68090',
        type: 'USDL',
        number: '1231231230',
        issuedDate: '2000-11-22',
        issuer: 'WY',
        expirationDate: '2030-11-22'
      },
      selfieDocumentId: 'a74f9092-5889-430a-9c19-6712f9f68090'
    }
  })

  afterEach(() => {
    clock.restore()
    sinon.reset()
    nock.cleanAll()
  })

  function post(
    payload,
    accountRequestId = '00000000-0000-AAAA-AAAA-000000000333'
  ) {
    const token = app.services.token.get({
      scopes: ['account_requests'],
      resources: [`account_requests#${accountRequestId}`],
      expiration: 10
    })

    return request(app.server)
      .post(`/v1/signers`)
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect('Content-Type', /json/)
  }

  describe('when using bad auth', () => {

    it('should complain if missing token', () => {
      return request(app.server)
        .post(`/v1/signers`)
        .send(newSigner)
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should complain if the token is malformed', () => {
      return request(app.server)
        .post(`/v1/signers`)
        .set('Authorization', 'Bearer ' + 'ASDASDASD')
        .send(newSigner)
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should complain if the token is not scoped to account_requests', () => {
      const token = app.services.token.get({
        scopes: ['signers'],
        resources: [`signers#00000000-0000-0000-0000-000000000000`],
        expiration: 10
      })

      return request(app.server)
        .post(`/v1/signers`)
        .set('Authorization', 'Bearer ' + token)
        .send(newSigner)
        .expect('Content-Type', /json/)
        .expect(403)
    })

    it('should complain if the token is not scoped to the correct account_request', () => {
      const token = app.services.token.get({
        scopes: ['account_requests'],
        resources: [`account_requests#00000000-0000-0000-0000-000000000000`],
        expiration: 10
      })

      return request(app.server)
        .post(`/v1/signers`)
        .set('Authorization', 'Bearer ' + token)
        .send(newSigner)
        .expect('Content-Type', /json/)
        .expect(403)
    })

    it('should complain if the token has invalid ids', () => {
      const token = app.services.token.get({
        scopes: ['account_requests'],
        resources: [`account_requests#asdasd`],
        expiration: 10
      })

      return request(app.server)
        .post(`/v1/signers`)
        .set('Authorization', 'Bearer ' + token)
        .send(newSigner)
        .expect('Content-Type', /json/)
        .expect(403)
    })

    it('should not complain with token with multiple scopes', () => {
      const token = app.services.token.get({
        scopes: ['signers', 'account_requests'],
        resources: [
          `account_requests#00000000-0000-AAAA-AAAA-000000000333`,
          `signers#00000000-0000-0000-0000-000000000001`,
          `signers#00000000-0000-0000-0000-000000000002`,
          `signers#00000000-0000-0000-0000-000000000003`
        ],
        expiration: 10
      })

      return request(app.server)
        .post(`/v1/signers`)
        .set('Authorization', 'Bearer ' + token)
        .send(newSigner)
        .expect('Content-Type', /json/)
        .expect(201)
    })
  })

  describe('when validating', () => {
    it('should complain about empty schema', async () => {
      return post({ accountRequestId: '00000000-0000-AAAA-AAAA-000000000333' }).expect(400)
    })

    describe('the schema', () => {
      [
        'email',
        'role',
      ].map(field => {
        it(`should complain about missing ${field}`, async () => {
          return post(_.omit(newSigner, field))
            .expect(400)
            .expect(res => {
              expect(res.body.message).to.contain(`"${field}" is required`)
            })
        })
        return field
      })
        .forEach(field => {
          it(`should complain about bad field ${field}`, async () => {
            const badSigner = { ...newSigner, [field]: '' + Math.random() }
            return post(badSigner)
              .expect(400)
              .expect(res => {
                expect(res.body.message).to.contain('minimal required parameters for this endpoint were not met')
                expect(res.body.message).to.contain(`${field}" must be `)
              })
          })
        })

      it('should complain about what data is wrong', async () => {
        const payload = {
          ...newSigner,
          "firstName": "982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623",
          "middleName": "982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623",
          "lastName": "982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623",
          "role": "PRIMARY",
          "dateOfBirth": "2000-11-11",
          "phoneNumber": "2345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345234523452345",
          "email": "emailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongemailuserthatisverylongjonathan@wearesingular.com",
          "address": "982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623",
          "city": "982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623",
          "state": "ALAAAASSDASASD",
          "zipCode": "123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123123213123123",
          "employer": "982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623 982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623",
          "ssn": "982-34-234523452345234523450823",
          "idProofDocument": {
            ...(newSigner.idProofDocument),
            "number": "982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623982yu3408u23408urjt03r j=-03495=093=465032-0-2340502453692453o67jk24'[5okj76p[24o5k76[]24iok576[p2o435i6]23i5]6io2345][6i4235^>4253>^243[5pok6-2[o935i623",
          },
        }

        return post(payload)
          .expect(400)
          .expect(res => {
            expect(res.body.message).to.contain('The minimal required parameters for this endpoint were not met')
            expect(res.body.message).to.contain('"firstName" length must be less than or equal to 250 characters long')
            expect(res.body.message).to.contain('"email" must be a valid email')
            expect(res.body.message).to.contain('"middleName" length must be less than or equal to 250 characters long')
            expect(res.body.message).to.contain('"lastName" length must be less than or equal to 250 characters long')
            expect(res.body.message).to.contain('"address" length must be less than or equal to 250 characters long')
            expect(res.body.message).to.contain('"city" length must be less than or equal to 250 characters long')
            expect(res.body.message).to.contain('"zipCode" length must be less than or equal to 100 characters long')
            expect(res.body.message).to.contain('"employer" length must be less than or equal to 250 characters long')
            expect(res.body.message).to.contain('"ssn" length must be less than or equal to 20 characters long')
            expect(res.body.message).to.contain('"phoneNumber" length must be less than or equal to 20 characters long')
            expect(res.body.message).to.contain('"state" length must be less than or equal to 3 characters long')
            expect(res.body.message).to.contain('"idProofDocument.number" length must be less than or equal to 100 characters long')
          })

      })
    })

    it('should allow empty id proof document data', async () => {
      return post(_.omit(newSigner, 'idProofDocument'))
        .expect(201)
    })

    describe('when providing with consent', async () => {
      it('should complain about false terms consent', async () => {
        return post({ ...newSigner, consent: false })
          .expect(412)
          .expect(res => {
            expect(res.body.message).to.contain('Consent Terms not granted')
          })
      })

      it('should complain about false account opening consent', async () => {
        return post({ ...newSigner, consentAccountOpening: false })
          .expect(412)
          .expect(res => {
            expect(res.body.message).to.contain('Consent Account Opening not granted')
          })
      })

      it('should complain about false privacy policy consent', async () => {
        return post({ ...newSigner, consentPrivacyPolicy: false })
          .expect(412)
          .expect(res => {
            expect(res.body.message).to.contain('Consent Privacy Policy not granted')
          })
      })

      it('should allow false communication consent', async () => {
        return post({ ...newSigner, consentCommunication: false })
          .expect(201)
      })
    })

    it('should complain about bad selfieDocumentId', async () => {
      const data = { ...newSigner, selfieDocumentId: 'a74f9092-0000-0000-0000-000000000000' }
      return post(data)
        .expect(412)
        .expect(res => {
          expect(res.body.message).to.contain('Could not fetch the documents associated with this signer')
        })
    })

    it('should complain about bad idProofDocument document id', async () => {
      let data = Object.assign({}, newSigner)
      data.idProofDocument = {
        ...newSigner.idProofDocument,
        backDocumentId: 'a74f9092-0000-0000-0000-000000000000'
      }
      return post(data)
        .expect(412)
        .expect(res => {
          expect(res.body.message).to.contain('Could not fetch the documents associated with this signer')
        })
    })

    it('should complain about bad idProofDocument document type issuer relation', async () => {
      let data = Object.assign({}, newSigner)
      data.idProofDocument = {
        ...newSigner.idProofDocument,
        issuer: 'USA'
      }
      return post(data)
        .expect(400)
        .expect(res => {
          expect(res.body.message).to.contain('"idProofDocument.issuer" must be one of [AL, AK, AS')
        })
    })

    it('should not allow to add signers on a non INCOMPLETE account request', async () => {
      await knex('account_requests').update('status', 'INCOMPLETE').where('id', '00000000-0000-AAAA-AAAA-000000000333')

      const payload = {
        ...newSigner,
        role: 'PRIMARY'
      }

      return post(payload)
        .expect(412)
        .expect(res => {
          expect(res.body.message).to.contain('Can only add new signers to DRAFT account request')
        })
    })

    it('should not allow more than 1 PRIMARY', async () => {
      const payload = {
        ...newSigner,
        role: 'PRIMARY'
      }

      await post(payload)
      return post(payload)
        .expect(412)
        .expect(res => {
          expect(res.body.message).to.contain('can only have one PRIMARY signer')
        })
    })

    it('should not allow first signer to be SECONDARY', async () => {
      const payload = {
        ...newSigner,
        role: 'SECONDARY'
      }

      return post(payload)
        .expect(412)
        .expect(res => {
          expect(res.body.message).to.contain('First signer added should be PRIMARY')
        })
    })

    it('should not allow more than 5 invitees', async () => {
      const payload = {
        ...newSigner,
        role: 'SECONDARY'
      }
      await post({ ...newSigner, role: 'PRIMARY' })
      await post(payload)
      await post(payload)
      await post(payload)

      return post(payload)
        .expect(412)
        .expect(res => {
          expect(res.body.message).to.contain(`Account request has reached maximum number of signers`)
        })
    })
  })

  describe('with valida data', () => {
    it('should return 201', async () => {
      return post(newSigner).expect(201)
    })

    it('should return a valid token to access the created signer', async () => {
      return post(newSigner)
        .expect(201)
        .expect(res => {
          expect(res.headers).to.have.ownProperty('x-nimble-token')

          const tokenStr = res.headers['x-nimble-token']
          expect(tokenStr).to.be.an('string')

          const token = app.plugins.jwt.decode(tokenStr)
          expect(token).to.be.an('object')

          expect(token.scopes).to.contain('signers')
          expect(token.resources).to.contain(`signers#${res.body.id}`)
        })
    })

    it('should return the newly created signer', async () => {
      return post(newSigner)
        .expect(201)
        .expect(res => {
          const expectedBody = _.omit(res.body, 'id', 'invitedAt', 'verificationStatus', 'remoteMetadata')
          const expectedResult = _.omit(blueprints.signers.signer_2, 'id', 'invitedAt', 'verificationStatus', 'remoteMetadata')
          expect(expectedBody).to.deep.equal(expectedResult)
        })
    })

    it('should return 201 wen backDocumentId is missing if type is not USDL', async () => {
      let data = Object.assign({}, newSigner)
      data.idProofDocument = {
        ..._.omit(newSigner.idProofDocument, 'backDocumentId'),
        type: 'PASSPORT',
        issuer: 'USA'
      }

      return post(data)
        .expect(201)
    })

    it('should allow emails with weird TLD ', async () => {
      const payload = {
        ...newSigner,
        email: 'gob@wearesingular.con'
      }

      return post(payload).expect(201)
    })

    it('should create an signer as PRIMARY', async () => {
      const payload = {
        ...newSigner,
        role: 'PRIMARY'
      }

      return post(payload)
        .expect(201)
        .then(async res => {
          expect(res.body.role).to.equal('PRIMARY')
        })
    })

    it('should create a non first signer when signer is SECONDARY', async () => {
      const payload = {
        ...newSigner,
        role: 'SECONDARY'
      }
      await post(newSigner)

      return post(payload)
        .expect(201)
        .then(async res => {
          expect(res.body.role).to.equal('SECONDARY')
        })
    })

    it('should set createdById to the correct signer', () => {
      return post(newSigner)
        .expect(201)
        .then(async res => {
          const targetAccountRequest = await knex('account_requests')
            .where('id', newSigner.accountRequestId)
            .first()

          return expect(targetAccountRequest.created_by_id).to.equal(res.body.id)
        })
    })

    describe('signer should have status', () => {
      it('PENDING when all personal data in sent', async () => {
        return post(newSigner)
          .expect(201)
          .then(async res => {
            return expect(res.body.status).to.equal('PENDING')
          })
      })

      it('INCOMPLETE when some personal data in sent', async () => {
        return post(_.omit(newSigner, 'firstName'))
          .expect(201)
          .then(async res => {
            return expect(res.body.status).to.equal('INCOMPLETE')
          })
      })
    })

    describe('publish event', function () {
      it('should publish signer create event if personal data is completed', function () {
        return post(newSigner)
          .expect(201)
          .then(async () => {
            expect(eventPublishSpy).to.have.been.calledOnce
            const expected = eventPublishSpy.getCall(0).firstArg
            expect(expected).to.have.property('id')
            expect(expected).to.have.property('topicArn', 'arn:aws:sns:us-east-1:000000000000:core-tst-signers')
            expect(expected).to.have.property('event', 'signer_created')
          })
      })

      it('should not publish signer create event if personal data is not completed', function () {
        return post(_.omit(newSigner, 'firstName'))
          .expect(201)
          .then(async () => {
            expect(eventPublishSpy).to.have.not.been.called
          })
      })
    })

    describe('trigger email verification', function () {
      it('should send email if personal data is completed', function () {
        return post(newSigner)
          .expect(201)
          .then(async () => {
            await sleep(5) // wait for the async stuff
            expect(verifyEmailSpy).to.have.been.calledOnce
          })
      })

      it('should not send email if personal data is not completed', function () {
        return post(_.omit(newSigner, 'firstName'))
          .expect(201)
          .then(async () => {
            await sleep(5) // wait for the async stuff
            expect(verifyEmailSpy).to.have.not.been.called
          })
      })
    })

    describe('trigger invite signer', function () {
      it('should send email if personal data is not completed', function () {
        return post(_.omit(newSigner, 'firstName'))
          .expect(201)
          .then(async () => {
            await sleep(5) // wait for the async stuff
            expect(inviteSignerEmailSpy).to.have.been.calledOnce
          })
      })

      it('should not send email if personal data is completed', function () {
        return post(newSigner)
          .expect(201)
          .then(async () => {
            await sleep(5) // wait for the async stuff
            expect(inviteSignerEmailSpy).to.have.not.been.called
          })
      })
    })
  })
})
