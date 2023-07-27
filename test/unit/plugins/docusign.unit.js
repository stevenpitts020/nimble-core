const axios = require('axios')
const nock = require('nock')
const config = require('../../../config')
axios.defaults.adapter = require('axios/lib/adapters/http')
const jwt = require('../../../app/plugins/jwt')

const docusign = require('../../../app/plugins/docusign')
const mocks = require('../../support/mock/docusign')

describe('Docusign', () => {
  describe('Class', () => {
    it('should exist', () => {
      expect(docusign).not.to.be.undefined
    })

    it('should be mockable', () => {
      expect(docusign.constructor).not.to.be.undefined
      expect(docusign).not.to.be.undefined
    })
  })

  describe('Instance', () => {

    beforeEach(async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
      await seed.docusignTemplate.create()

      const docusignTemplateIds = await app.services.docusignTemplate.fetch({ institutionId: "2552ab85-08da-4bb5-be00-9e94d282d311", version: 1 })
      docusign.setDocusignTemplates(docusignTemplateIds)
    })

    describe('sendEnvelopeWithMultipleDocuments', () => {
      beforeEach(() => {
        nock.disableNetConnect()
        nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
      })

      afterEach(() => { nock.cleanAll() })

      it('should return a template', async () => {
        // get sign in
        const scope0 = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

        // mock template
        const scope1 = nock(config.get('docusign').basePath)
          .get(`/v2.1/accounts/${config.get('docusign').accountID}/templates/${docusign.docusignTemplates.AccountApplication}/documents/1/tabs`)
          .reply(200, mocks.mockDocumentTabs)

        const scope2 = nock(config.get('docusign').basePath)
          .post(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes`)
          .reply(200, mocks.mockCreateEnvelope)


        const args ={
          accountRequestId: 'string',
          signers: [mocks.validUser],
          accountOptions: mocks.accountOptions,
          ccRecipient: {
            fullName: 'Some dude Specimen',
            email: 'psousa+1@wearesingular.com',
          }
        }
        const result = await docusign.sendEnvelopeWithMultipleDocuments(args)

        expect(result).not.to.be.undefined
        expect(result.results.envelopeId).to.equal(mocks.mockCreateEnvelope.envelopeId)
        expect(result.results.status).to.equal(mocks.mockCreateEnvelope.status)
        scope0.done()
        scope1.done()
        scope2.done()
      })

      it('should throw when error occurs', async () => {
        const scope = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

        const scope1 = nock(config.get('docusign').basePath)
          .get(`/v2.1/accounts/${config.get('docusign').accountID}/templates/${docusign.docusignTemplates.AccountApplication}/documents/1/tabs`)
          .reply(500, mocks.mockDocumentTabs)

        const args ={
          accountRequestId: 'string',
          signers: [mocks.validUser],
          accountOptions: mocks.accountOptions,
          ccRecipient: {
            fullName: 'Some dude Specimen',
            email: 'psousa+1@wearesingular.com',
          }
        }

        try {
          await docusign.sendEnvelopeWithMultipleDocuments(args)
        } catch (error) {
          expect(error).to.be.an.instanceof(Error)
        }

        scope.done()
        scope1.done()
      })


      it('should return error with empty signers', async () => {
        const args = {
          accountRequestId: 'string',
          signers: [],
          accountOptions: mocks.accountOptions,
          ccRecipient: {
            fullName: 'Some dude Specimen',
            email: 'psousa+1@wearesingular.com',
          }
        }

        try {
          await docusign.sendEnvelopeWithMultipleDocuments(args)
        } catch (error) {
          expect(error.message).to.equal("Cannot send envelope without signers.")
          expect(error).to.be.an.instanceof(Error)
        }
      })

      it('should return error with empty options', async () => {
        const args ={
          accountRequestId: 'string',
          signers: [mocks.validUser],
          accountOptions: null,
          ccRecipient: {
            fullName: 'Some dude Specimen',
            email: 'psousa+1@wearesingular.com',
          }
        }

        try {
          await docusign.sendEnvelopeWithMultipleDocuments(args)
        } catch (error) {
          expect(error.message).to.equal("Cannot send envelope without options.")
          expect(error).to.be.an.instanceof(Error)
        }
      })

      it('should return error with more than 4 signers', async () => {
        const args ={
          accountRequestId: 'string',
          signers: [mocks.validUser, mocks.validUser, mocks.validUser, mocks.validUser, mocks.validUser],
          accountOptions: mocks.accountOptions,
          ccRecipient: {
            fullName: 'Some dude Specimen',
            email: 'psousa+1@wearesingular.com',
          }
        }

        try {
          await docusign.sendEnvelopeWithMultipleDocuments(args)
        } catch (error) {
          expect(error.message).to.equal("A document only accepts 4 signers max.")
          expect(error).to.be.an.instanceof(Error)
        }
      })

      it('should return error with no opening amount', async () => {
        const args ={
          accountRequestId: 'string',
          signers: [mocks.validUser],
          accountOptions: {...mocks.accountOptions, openingAmount: ''},
          ccRecipient: {
            fullName: 'Some dude Specimen',
            email: 'psousa+1@wearesingular.com',
          }
        }

        try {
          await docusign.sendEnvelopeWithMultipleDocuments(args)
        } catch (error) {
          expect(error.message).to.equal("Expecting a number for initial Deposit.")
          expect(error).to.be.an.instanceof(Error)
        }
      })

      it('should return error with no products', async () => {
        const args ={
          accountRequestId: 'string',
          signers: [mocks.validUser],
          accountOptions: {...mocks.accountOptions, productConfigurations: []},
          ccRecipient: {
            fullName: 'Some dude Specimen',
            email: 'psousa+1@wearesingular.com',
          }
        }

        try {
          await docusign.sendEnvelopeWithMultipleDocuments(args)
        } catch (error) {
          expect(error.message).to.equal("Cannot send envelope without products.")
          expect(error).to.be.an.instanceof(Error)
        }
      })

      it('should return error with no account request id', async () => {
        const args ={
          signers: [mocks.validUser],
          accountOptions: mocks.accountOptions,
          ccRecipient: {
            fullName: 'Some dude Specimen',
            email: 'psousa+1@wearesingular.com',
          }
        }

        try {
          await docusign.sendEnvelopeWithMultipleDocuments(args)
        } catch (error) {
          expect(error.message).to.equal("Cannot send envelope without accountRequestId.")
          expect(error).to.be.an.instanceof(Error)
        }
      })

      it('should return error if no template are set', async () => {
        docusign.setDocusignTemplates({})

        const args ={
          accountRequestId: 'string',
          signers: [mocks.validUser],
          accountOptions: mocks.accountOptions,
          ccRecipient: {
            fullName: 'Some dude Specimen',
            email: 'psousa+1@wearesingular.com',
          }
        }

        try {
          await docusign.sendEnvelopeWithMultipleDocuments(args)
        } catch (error) {
          expect(error.message).to.equal("Missing templates")
          expect(error).to.be.an.instanceof(Error)
        }
      })
    })

    describe('buildSavingsTemplate', () => {
      beforeEach(() => {
        nock.disableNetConnect()
        nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
      })

      afterEach(() => { nock.cleanAll() })

      it('should return a valid template', async () => {
        let scope = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)
        await docusign._setDocusignAuthorizationAndSetHeader()
        scope.done()

        scope = nock(config.get('docusign').basePath)
          .get(`/v2.1/accounts/${config.get('docusign').accountID}/templates/${docusign.docusignTemplates.AccountApplication}/documents/1/tabs`)
          .reply(200, mocks.mockDocumentTabs)

        const ccRecipient = {
          fullName: 'Some dude Specimen',
          email: 'psousa+1@wearesingular.com',
        }

        const result = await docusign.buildSavingsTemplate([mocks.validUser], mocks.accountOptions, ccRecipient, docusign.docusignTemplates.AccountApplication)

        expect(result).not.to.be.undefined
        expect(result.compositeTemplateId).to.equal(mocks.mockCompositeTemplate.compositeTemplateId)

        scope.done()
      })

      it('should return a template with a list of signers', async () => {
        let scope = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)
        await docusign._setDocusignAuthorizationAndSetHeader()
        scope.done()

        scope = nock(config.get('docusign').basePath)
          .get(`/v2.1/accounts/${config.get('docusign').accountID}/templates/${docusign.docusignTemplates.AccountApplication}/documents/1/tabs`)
          .reply(200, mocks.mockDocumentTabs)

        const ccRecipient = {
          fullName: 'Some dude Specimen',
          email: 'psousa+1@wearesingular.com',
        }

        const result = await docusign.buildSavingsTemplate([mocks.validUser, mocks.validUser], mocks.accountOptions, ccRecipient, docusign.docusignTemplates.AccountApplication)

        expect(result).not.to.be.undefined
        expect(result.inlineTemplates[0].recipients.signers.length).to.equal(2)

        scope.done()
      })
    })

    describe('getEnvelopeById', () => {
      beforeEach(() => {
        nock.disableNetConnect()
        nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
      })

      afterEach(() => { nock.cleanAll() })

      it('should return a envelope', async () => {
        const scope1 = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)
        const scope2 = nock(app.config.get('docusign').basePath)
          .get(`/v2.1/accounts/8872016/envelopes/5d715751-e027-45e4-884b-99bb85c357dc?include=recipients`)
          .reply(200, mocks.webhookRequest)

        const result = await docusign.getEnvelopeById('5d715751-e027-45e4-884b-99bb85c357dc')

        expect(result).not.to.be.undefined
        expect(result.envelopeId).to.equal('5d715751-e027-45e4-884b-99bb85c357dc')

        scope1.done()
        scope2.done()
      })

      it('should throw when error occurs', async () => {
        let scope = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

        scope = nock(app.config.get('docusign').basePath)
          .get(`/v2.1/accounts/8872016/envelopes/5d715751-e027-45e4-884b-99bb85c357dc?include=recipients`)
          .reply(500, mocks.webhookRequest)

        try {
          await docusign.getEnvelopeById('5d715751-e027-45e4-884b-99bb85c357dc')
        } catch (error) {
          expect(error).to.be.an.instanceof(Error)
        }
        scope.done()
      })

      it('should throw when authentication fails', async () => {
        const scope = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(500, mocks.mockToken)

        try {
          await docusign.getEnvelopeById('5d715751-e027-45e4-884b-99bb85c357dc')
        } catch (error) {
          expect(error).to.be.an.instanceof(Error)
        }
        scope.done()
      })
    })

    describe('getCombinedPDFById', () => {
      beforeEach(() => {
        nock.disableNetConnect()
      })

      afterEach(() => { nock.cleanAll() })

      it('should return a pdf', async () => {
        const scope1 = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

        const scope2 = nock(config.get('docusign').basePath)
          .get('/v2.1/accounts/8872016/envelopes/xxx/documents/combined')
          .reply(200, 'ok')

        const result = await docusign.getCombinedPDFById('xxx')

        expect(result).not.to.be.undefined

        scope1.done()
        scope2.done()
      })

      it('should throw when error occurs', async () => {
        let scope = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

        scope = nock(config.get('docusign').basePath)
          .get('/v2.1/accounts/8872016/envelopes/5d715751-e027-45e4-884b-99bb85c357dc/documents/combined')
          .reply(500, 'ok')

        try {
          await docusign.getCombinedPDFById('5d715751-e027-45e4-884b-99bb85c357dc')
        } catch (error) {
          expect(error).to.be.an.instanceof(Error)
        }
        scope.done()
      })

      it('should throw when authentication fails', async () => {
        const scope = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(500, mocks.mockToken)

        try {
          await docusign.getCombinedPDFById('5d715751-e027-45e4-884b-99bb85c357dc')
        } catch (error) {
          expect(error).to.be.an.instanceof(Error)
        }
        scope.done()
      })
    })

    describe('createRecipientView', () => {
      beforeEach(() => {
        nock.disableNetConnect()
        nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
      })

      afterEach(() => { nock.cleanAll() })

      describe('with success', () => {
        beforeEach(() => {
          nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

          nock(app.config.get('docusign').basePath)
            .post(`/v2.1/accounts/8872016/envelopes/5d715751-e027-45e4-884b-99bb85c357dc/views/recipient`)
            .reply(200, mocks.mockCreateRecipientViewSuccess)
        })

        it('should return a url for embedding', async () => {
          const result = await docusign.createRecipientView('5d715751-e027-45e4-884b-99bb85c357dc', mocks.validUser, mocks.accountOptions.institutionDomain)

          expect(result).not.to.be.undefined
          expect(result).to.equal(mocks.mockCreateRecipientViewSuccess.url)
        })
      })

      describe('with error', () => {
        it('should throw when error occurs', async () => {
          nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

          nock(app.config.get('docusign').basePath)
            .post(`/v2.1/accounts/8872016/envelopes/5d715751-e027-45e4-884b-99bb85c357dc/views/recipient`)
            .reply(404, mocks.mockCreateRecipientViewError)

          try {
            await docusign.createRecipientView('5d715751-e027-45e4-884b-99bb85c357dc', mocks.validUser, mocks.accountOptions.institutionDomain)
          } catch (error) {
            expect(error).to.be.an.instanceof(Error)
            expect(error.message).to.equal("Not Found")
            expect(error.response.body.message).to.equal(mocks.mockCreateRecipientViewError.message)
          }
        })

        it('should throw envelopeId is missing', async () => {
          try {
            await docusign.createRecipientView(null)
          } catch (error) {
            expect(error).to.be.an.instanceof(Error)
            expect(error.message).to.equal("Cannot send envelope without envelopeId.")
          }
        })

        it('should throw signer is missing', async () => {
          try {
            await docusign.createRecipientView('id')

          } catch (error) {
            expect(error).to.be.an.instanceof(Error)
            expect(error.message).to.equal("Cannot send envelope without signer.")
          }
        })

        it('should throw institutionDomain is missing', async () => {
          try {
            await docusign.createRecipientView('id', mocks.validUser, null)
          } catch (error) {
            expect(error).to.be.an.instanceof(Error)
            expect(error.message).to.equal("Cannot send envelope without institutionDomain.")
          }
        })

        it('should throw when authentication fails', async () => {
          const scope = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(500, mocks.mockToken)

          try {
            await docusign.createRecipientView('5d715751-e027-45e4-884b-99bb85c357dc', mocks.validUser, mocks.accountOptions.institutionDomain)
          } catch (error) {
            expect(error).to.be.an.instanceof(Error)
          }
          scope.done()
        })
      })
    })


    describe('updateEnvelopeRecipients', () => {
      beforeEach(() => {
        nock.disableNetConnect()
        nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
      })

      afterEach(() => { nock.cleanAll() })

      describe('with success', () => {

        it('should update recipient', async () => {
          nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)
          // preparation
          const envelopeId = '5d715751-e027-45e4-884b-99bb85c357dc'
          const recipientId = '1'
          const scope1 = nock(app.config.get('docusign').basePath)
            .get(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`)
            .reply(200, mocks.mockTemplateTabs)

          const scope2 = nock(app.config.get('docusign').basePath)
            .put(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients`)
            .reply(200, mocks.mockUpdateRecipients)

          const scope3 = nock(app.config.get('docusign').basePath)
            .put(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`)
            .reply(200, mocks.mockUpdateTabs)

          const args ={
            accountRequestId: 'string',
            signers: [mocks.validUser],
            accountOptions: mocks.accountOptions
          }
          const result = await docusign.updateEnvelopeRecipients(args, envelopeId, mocks.validUser.id)

          scope1.done()
          scope2.done()
          scope3.done()

          expect(result).not.to.be.undefined
          expect(result.recipientUpdateResults[0].recipientId).to.equal(recipientId)
        })

        it('should update secondary signers', async () => {
          nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

          // preparation
          const envelopeId = '5d715751-e027-45e4-884b-99bb85c357dc'
          const recipientId = '3'
          const scope1 = nock(app.config.get('docusign').basePath)
            .get(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`)
            .reply(200, mocks.mockTemplateTabs)

          const scope2 = nock(app.config.get('docusign').basePath)
            .put(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients`)
            .reply(200, mocks.mockUpdateRecipients)

          const args ={
            accountRequestId: 'string',
            signers: [mocks.validUser, mocks.validUser, {...mocks.validUser, id: '001'}],
            accountOptions: mocks.accountOptions
          }
          const result = await docusign.updateEnvelopeRecipients(args, envelopeId, '001')

          scope1.done()
          scope2.done()

          expect(result).not.to.be.undefined
        })

        it('requires signer Id', async () => {
          nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

          // preparation
          const envelopeId = '5d715751-e027-45e4-884b-99bb85c357dc'

          const args ={
            accountRequestId: 'string',
            signers: [mocks.validUser],
            accountOptions: mocks.accountOptions
          }
          try {
            await docusign.updateEnvelopeRecipients(args, envelopeId)
          } catch (error) {
            expect(error).to.be.an.instanceof(Error)
            expect(error.message).to.equal("Cannot update envelope without signerId.")
          }
        })

        it('should catch error', async () => {
          nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

          // preparation
          const envelopeId = '5d715751-e027-45e4-884b-99bb85c357dc'
          const recipientId = '1'

          const scope1 = nock(app.config.get('docusign').basePath)
            .get(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`)
            .reply(200, mocks.mockTemplateTabs)

          const scope6 = nock(app.config.get('docusign').basePath)
            .put(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients/1/tabs`)
            .reply(400, mocks.mockCreateRecipientViewError)

          const scope2 = nock(app.config.get('docusign').basePath)
            .put(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients`)
            .reply(400, mocks.mockCreateRecipientViewError)

          const args ={
            accountRequestId: 'string',
            signers: [mocks.validUser],
            accountOptions: mocks.accountOptions
          }
          try {
            await docusign.updateEnvelopeRecipients(args, envelopeId, mocks.validUser.id)
          } catch (error) {
            scope1.done()
            scope6.done()
            scope2.done()
            expect(error).to.be.an.instanceof(Error)
            expect(error.message).to.equal("Error: Bad Request")
          }
        })
      })
    })
  })


  describe('Helpers/Private Functions', () => {

    describe('_getUpdatedRecipientAndTabs', () => {
      beforeEach(() => {
        nock.disableNetConnect()
        nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
        nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)
      })

      afterEach(() => { nock.cleanAll() })

      it('should return an updated Signer ojb', async () => {
        // we need to call this to set the auth token
        await docusign._setDocusignAuthorizationAndSetHeader()
        // preparation
        const envelopeId = '5d715751-e027-45e4-884b-99bb85c357dc'
        const recipientId = '1'

        const scope1 = nock(app.config.get('docusign').basePath)
          .get(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`)
          .reply(200, mocks.mockTemplateTabs)

        const scope2 = nock(app.config.get('docusign').basePath)
            .put(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`)
            .reply(200, mocks.mockUpdateTabs)

        const result = await docusign._getUpdatedRecipientAndTabs(mocks.validUser, config.get('docusign').accountID, envelopeId, recipientId)

        scope1.done()
        scope2.done()

        expect(result).not.to.be.undefined
        expect(result.email).to.equal(mocks.validUser.email)
        expect(result.name).to.equal(mocks.validMapping.fullName)
        expect(result.recipientId).to.equal(recipientId)
        expect(result.roleName).to.equal('signer')
        expect(result.clientUserId).to.equal(mocks.validUser.id)

        // check updated tabs
        // deep equal does not work here :(
        expect(result.tabs.textTabs[0].tabId).to.equal(mocks.mockUpdateTabs.textTabs[0].tabId)
        expect(result.tabs.textTabs[0].value).to.equal(mocks.mockUpdateTabs.textTabs[0].value)
        expect(result.tabs.textTabs[1].tabId).to.equal(mocks.mockUpdateTabs.textTabs[1].tabId)
        expect(result.tabs.textTabs[1].value).to.equal(mocks.mockUpdateTabs.textTabs[1].value)
      })

      it('should return null if failed to get tabs', async () => {
        // we need to call this to set the auth token
        await docusign._setDocusignAuthorizationAndSetHeader()
        // preparation
        const envelopeId = '5d715751-e027-45e4-884b-99bb85c357dc'
        const recipientId = '1'
        const scope1 = nock(app.config.get('docusign').basePath)
          .get(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`)
          .reply(200, { "textTabs": [] })

        const result = await docusign._getUpdatedRecipientAndTabs(mocks.validUser, config.get('docusign').accountID, envelopeId, recipientId)

        scope1.done()

        expect(result).not.to.be.undefined
        expect(result).to.equal(null)
      })

      it('should catch when error occurs and return null', async () => {
        // we need to call this to set the auth token
        await docusign._setDocusignAuthorizationAndSetHeader()
        // preparation
        const envelopeId = '5d715751-e027-45e4-884b-99bb85c357dc'
        const recipientId = '1'
        const scope1 = nock(app.config.get('docusign').basePath)
          .get(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`)
          .reply(400, mocks.mockCreateRecipientViewError)

        const result = await docusign._getUpdatedRecipientAndTabs(mocks.validUser, config.get('docusign').accountID, envelopeId, recipientId)

        scope1.done()

        expect(result).not.to.be.undefined
        expect(result).to.equal(null)
      })
    })

    describe('_buildSubject', () => {
      it('should return valid subject', () => {
        const result = docusign._buildSubject(mocks.accountOptions.institutionName, mocks.accountOptions.productName)

        expect(result).not.to.be.undefined
        expect(result).to.equal("Your Central Bank Simple Checking Account Agreement")
      })

      it('should return error arguments are missing', () => {
        try {
          docusign._buildSubject("")
        } catch (error) {
          expect(error).to.be.an.instanceof(Error)
          expect(error.message).to.equal("Missing institutionName or productName")
        }
      })
    })

    describe('_getReturnURL', () => {
      it('should return valid url', () => {
        const result = docusign._getReturnURL(mocks.accountOptions.institutionDomain)

        expect(result).not.to.be.undefined
        expect(result).to.equal(`${config.get('protocol')}://${config.get('frontend.onboarding_domain')}/${mocks.accountOptions.institutionDomain}/onboarding/sign-contract/`)
      })

      it('should return error arguments are missing', () => {
        try {
          docusign._getReturnURL("")
        } catch (error) {
          expect(error).to.be.an.instanceof(Error)
          expect(error.message).to.equal("Missing institutionDomain")
        }
      })
    })

    describe('_buildCCRecipientsList', () => {
      it('should return a docusign carboncopy', async () => {

        const user = {
          fullName: 'Sample Specimen',
          email: 'psousa+1@wearesingular.com',
        }

        const result = docusign._buildCCRecipientsList(user)
        expect(result).not.to.be.undefined
        expect(result.length).to.equal(1)
        expect(result[0].roleName).to.equal('admin')
        expect(result[0].recipientId).to.equal('5')
        expect(result[0].name).to.equal(user.fullName)
      })
    })

    describe('_getTemplateForProduct', () => {
      it('should return error if empty arg', async () => {
        try {
          await docusign._getTemplateForProduct(null)
        } catch (error) {
          expect(error).to.be.an.instanceof(Error)
        }
      })

      it('should return a list of templates for checking accounts', async () => {
        const expectedResult = [
          "5313cde2-5926-47b1-b358-56cc7bb786cc",
          "914b5f11-dbf4-4290-a43f-3243d728bb0b", // simple checking
          "c2b862c6-7827-46a1-bdcd-fea345785daa", //fees
          "e241451d-a10b-41ab-b1fc-37be09e3880b",
          "05db6673-5bb1-421f-be65-c71580bc28a9", // funds avail
          "5d397906-e438-4597-b5e7-fb6c3d5a1217", // privacy
          "b60fec89-18e3-41b8-8873-808d3c665569"
        ]

        const result = await docusign._getTemplateForProduct('simple-checking')
        expect(result).to.deep.equal(expectedResult)
      })

      it('should return a list of templates for savings accounts', async () => {
        const expectedResult = [
          "5313cde2-5926-47b1-b358-56cc7bb786cc",
          "ecd5df78-d3e4-4234-b643-3a711b4cc09c", // platinum
          "c2b862c6-7827-46a1-bdcd-fea345785daa", //fees
          "e241451d-a10b-41ab-b1fc-37be09e3880b",
          "5d397906-e438-4597-b5e7-fb6c3d5a1217",
          "b60fec89-18e3-41b8-8873-808d3c665569"
        ]

        const result = await docusign._getTemplateForProduct('platinum-savings')
        expect(result).to.deep.equal(expectedResult)
      })

      it('should return a empty array if not found', async () => {
        const expectedResult = []

        const result = await docusign._getTemplateForProduct('hello')
        expect(result).to.deep.equal(expectedResult)
      })

      it('should return error if no templates exist', async () => {
        docusign.setDocusignTemplates({})
        try {
          await docusign._getTemplateForProduct('simple-checking')
        } catch (error) {
          expect(error.message).to.equal("Missing templates")
          expect(error).to.be.an.instanceof(Error)
        }
      })
    })

    describe('_populateTextTabs', () => {
      const templateTabs = {
        textTabs: [
          { tabLabel: 'ssn', tabText: 'SSN' },
          { tabLabel: 'fullName', tabText: 'fullName' },
          { tabLabel: 'birthDate', tabText: 'birthDate' },
        ]
      }

      it('should return pre-populated tabs for a signer', async () => {
        const result = docusign._populateTextTabs(templateTabs, mocks.validMapping)

        expect(result).not.to.be.undefined
        expect(result.length).to.equal(3)
        expect(result[0].tabLabel).to.equal('\\*ssn')
        expect(result[0].locked).to.equal('true')
        expect(result[0].value).to.equal(mocks.validMapping.ssn)
        expect(result[1].tabLabel).to.equal('\\*fullName')
        expect(result[2].tabLabel).to.equal('\\*birthDate')
      })

      it('should add a suffix for second signer', async () => {
        const result = docusign._populateTextTabs(templateTabs, mocks.validMapping, 2)

        expect(result).not.to.be.undefined
        expect(result.length).to.equal(3)
        expect(result[0].tabLabel).to.equal('\\*ssn#2')
        expect(result[1].tabLabel).to.equal('\\*fullName#2')
        expect(result[2].tabLabel).to.equal('\\*birthDate#2')
      })

      it('should add a suffix for third signer', async () => {
        const result = docusign._populateTextTabs(templateTabs, mocks.validMapping, 3)

        expect(result).not.to.be.undefined
        expect(result.length).to.equal(3)
        expect(result[0].tabLabel).to.equal('\\*ssn#3')
        expect(result[1].tabLabel).to.equal('\\*fullName#3')
        expect(result[2].tabLabel).to.equal('\\*birthDate#3')
      })
    })


    describe('_buildAccountSavingsSignersList', () => {
      const templateTabs = {
        // this is just a small sample of the textTabs
        textTabs: [
          { tabLabel: 'ssn', tabText: 'SSN' },
          { tabLabel: 'fullName', tabText: 'fullName' },
          { tabLabel: 'phone', tabText: 'phone' }
        ]
      }

      it('should return a list of signers objs', async () => {
        const result = await docusign._buildAccountSavingsSignersList([mocks.validUser, {...mocks.validUser, firstName: 'John'}], mocks.accountOptions, templateTabs)

        expect(result).not.to.be.undefined
        expect(result[0].email).to.equal(mocks.validUser.email)
        expect(result[0].name).to.equal(mocks.validMapping.fullName)
        expect(result[0].recipientId).to.equal('1')
        expect(result[0].roleName).to.equal('signer')

        expect(result[0].tabs.textTabs[0].value).to.equal(mocks.validUser.ssn)
        expect(result[0].tabs.textTabs[0].tabLabel).to.equal('\\*ssn')

        // text tabs for co-signer

        expect(result[1].email).to.equal(mocks.validUser.email)
        expect(result[1].name).to.equal('John Constanza')
        expect(result[1].recipientId).to.equal('2')
        expect(result[1].roleName).to.equal('signer2')

        expect(result[1].tabs.textTabs[0].value).to.equal(mocks.validUser.ssn)
        expect(result[1].tabs.textTabs[0].tabLabel).to.equal('\\*ssn#2')

        expect(result[1].tabs.textTabs[1].value).to.equal('John Constanza')
        expect(result[1].tabs.textTabs[1].tabLabel).to.equal('\\*fullName#2')

        expect(result[1].tabs.textTabs[2].value).to.equal(mocks.validUser.phoneNumber)
        expect(result[1].tabs.textTabs[2].tabLabel).to.equal('\\*phone#2')
      })
    })

    describe('_buildMainSigner', () => {
      const templateTabs = {
        // this is just a small sample of the textTabs
        textTabs: [
          { tabLabel: 'ssn', tabText: 'SSN' },
          { tabLabel: 'fullName', tabText: 'fullName' },
          { tabLabel: 'phone', tabText: 'phone' }
        ]
      }

      it('should return a docusign object with valid textTabs', async () => {
        const result = await docusign._buildMainSigner([mocks.validUser], mocks.accountOptions, templateTabs)

        expect(result).not.to.be.undefined
        expect(result.email).to.equal(mocks.validUser.email)
        expect(result.name).to.equal(mocks.validMapping.fullName)
        expect(result.recipientId).to.equal('1')
        expect(result.roleName).to.equal('signer')
        expect(result.clientUserId).to.equal(mocks.validUser.id)

        expect(result.tabs.textTabs.length).to.equal(3)

        expect(result.tabs.textTabs[0].value).to.equal(mocks.validUser.ssn)
        expect(result.tabs.textTabs[0].tabLabel).to.equal('\\*ssn')

        expect(result.tabs.textTabs[1].value).to.equal(mocks.validMapping.fullName)
        expect(result.tabs.textTabs[1].tabLabel).to.equal('\\*fullName')

        expect(result.tabs.textTabs[2].value).to.equal(mocks.validMapping.phone)
        expect(result.tabs.textTabs[2].tabLabel).to.equal('\\*phone')

      })

      it('should return a docusign object with valid radio groups', async () => {
        const result = await docusign._buildMainSigner([mocks.validUser], mocks.accountOptions, templateTabs)
        const radioGroups = result.tabs.radioGroupTabs

        expect(radioGroups[0].groupName).to.equal('radioOwnershipType')
        expect(radioGroups[0].radios.length).to.equal(2)
        expect(radioGroups[0].radios[0].value).to.equal('individual')
        expect(radioGroups[0].radios[0].selected).to.equal('true')
        expect(radioGroups[0].radios[1].value).to.equal('joint_survivor')
      })

      it('should return a signer obj with joint_survivor true if multiple signers', async () => {
        const result = await docusign._buildMainSigner([mocks.validUser, {...mocks.validUser, firstName: 'John'}, {...mocks.validUser, firstName: 'Joe'}], mocks.accountOptions, templateTabs)

        const radioGroups = result.tabs.radioGroupTabs

        expect(radioGroups[0].groupName).to.equal('radioOwnershipType')
        expect(radioGroups[0].radios.length).to.equal(2)
        expect(radioGroups[0].radios[0].value).to.equal('individual')
        expect(radioGroups[0].radios[0].selected).to.equal('false')
        expect(radioGroups[0].radios[1].value).to.equal('joint_survivor')
        expect(radioGroups[0].radios[1].selected).to.equal('true')
      })

      it('should return a docusign object with valid checkbox groups for a Checking Account', async () => {
        const result = await docusign._buildMainSigner([mocks.validUser], mocks.accountOptions, templateTabs)
        const checkboxTabs = result.tabs.checkboxTabs

        expect(checkboxTabs.length).to.equal(3) // 7 products
        expect(checkboxTabs[0].tabLabel).to.equal('checkFunds')
        expect(checkboxTabs[0].selected).to.equal('true')

        expect(checkboxTabs[1].tabLabel).to.equal('checkDebit')
        expect(checkboxTabs[1].selected).to.equal('true')

        expect(checkboxTabs[2].tabLabel).to.equal('checkATM')
        expect(checkboxTabs[2].selected).to.equal('false')
      })

      it('should return a object with openingDepositAmount', async () => {
        const tabs = {
          textTabs: [
            { tabLabel: 'openingDepositAmount', tabText: 'openingDepositAmount' },
          ]
        }
        const result = await docusign._buildMainSigner([mocks.validUser], mocks.accountOptions, tabs)
        const transformedCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(mocks.accountOptions.openingAmount/100)

        expect(result).not.to.be.undefined
        expect(result.tabs.textTabs[0].value).to.equal(transformedCurrency)
        expect(result.tabs.textTabs[0].tabLabel).to.equal('\\*openingDepositAmount')
      })

      it('should return a docusign object with valid checkbox groups for a Savings Account', async () => {

        const mockedProductConfiguration = {
          initialDeposit: 250000099,
          product: {
            name: "Money Market",
            category: "SAVINGS",
            options: [
              { key: 'value_min', title: 'minimum Deposit', value: 500, category: 'initial_deposit' },
              { key: 'account_number', category: 'account_number', value: 'xpto-001' },
            ]
          },
        }

        const tabs = {
          textTabs: [
            { tabLabel: 'accountNumber', tabText: 'accountNumber' },
            { tabLabel: 'productName', tabText: 'productName' },
          ]
        }

        const result = await docusign._buildMainSigner([mocks.validUser], {...mocks.accountOptions, productConfigurations: [mockedProductConfiguration]}, tabs)

        expect(result).not.to.be.undefined
        expect(result.recipientId).to.equal('1')
        expect(result.roleName).to.equal('signer')

        // check if product name was passed
        expect(result.tabs.textTabs[0].value).to.equal('xpto-001')
        expect(result.tabs.textTabs[1].value).to.equal(mockedProductConfiguration.product.name)

        // check values of checkboxes
        const checkboxTabs = result.tabs.checkboxTabs

        expect(checkboxTabs[0].tabLabel).to.equal('checkFunds')
        expect(checkboxTabs[0].selected).to.equal('false')

        expect(checkboxTabs[1].tabLabel).to.equal('checkDebit')
        expect(checkboxTabs[1].selected).to.equal('false')

        expect(checkboxTabs[2].tabLabel).to.equal('checkATM')
        expect(checkboxTabs[2].selected).to.equal('true')
      })

    })


    describe('_mapSignerInformationToTextLabels', () => {
      it('should map signer to common info', async () => {
        const result = await docusign._mapSignerInformationToTextLabels(mocks.validUser)

        const validMapping = {
          fullName: 'George Constanza',
          email: 'psousa+1@wearesingular.com',
          clientUserId: '2e31d8c0-1226-4651-8a5d-4bd8aa454722',
          address1_2: "123 main street apt. 1\nLisbon, Orlando, fl 17101-0000",
          ssn: '123',
          birthDate: "3/13/1978",
          phone: '123123',
          presentEmployer: 'Singular',
          govID_type: 'Drivers License',
          govID_number: '123213',
          govID_expires: '12/12/2021',
          govID_issued: '12/12/2019',
        }

        expect(result).not.to.be.undefined
        expect(result).to.deep.equal(validMapping)
      })
    })

    describe('_buildSigner', () => {
      it('should return a docusign object with co-signer info', async () => {
        const result = await docusign._buildSigner(mocks.validUser, 1, {})

        expect(result).not.to.be.undefined
        expect(result.email).to.equal(mocks.validUser.email)
        expect(result.name).to.equal(mocks.validMapping.fullName)
        expect(result.recipientId).to.equal('1')
        expect(result.clientUserId).to.equal(mocks.validUser.id)
        expect(result.roleName).to.equal('signer')
      })

      it('should return correct recipientID', async () => {
        const result = await docusign._buildSigner(mocks.validUser, 2)

        expect(result).not.to.be.undefined
        expect(result.recipientId).to.equal('2')
        expect(result.roleName).to.equal('signer2')
      })

      it('should return a truncated full name if > 100 characters', async () => {
        const result = await docusign._buildSigner(
          {
            ...mocks.validUser,
            firstName: 'cvYfTaGr4SgImWlC3ZazYD687YIUCsMHA7rgK1SWVfIJwFsTBcsHyiN',
            lastName: 'pXWCFXPebSTGvajyRUBxYu9psSyUYSnNXYW5LqLDlwuoQgpRkpZguj7'
          },
          1,
          {}
        )

        expect(result).not.to.be.undefined
        expect(result.email).to.equal(mocks.validUser.email)
        expect(result.name).to.equal(
          'cvYfTaGr4SgImWlC3ZazYD687YIUCsMHA7rgK1SWVfIJwFsTBcsHyiN pXWCFXPebSTGvajyRUBxYu9psSyUYSnNXYW5LqLDl...'
        )
        expect(result.name.length).to.equal(100)
        expect(result.recipientId).to.equal('1')
        expect(result.clientUserId).to.equal(mocks.validUser.id)
        expect(result.roleName).to.equal('signer')
      })
    })

    describe('_setDocusignAuthorizationAndSetHeader', () => {
      beforeEach(() => {
        nock.disableNetConnect()
        nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
      })

      afterEach(() => { nock.cleanAll() })

      it('should not crash', async () => {
        const scope = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

        const result = await docusign._setDocusignAuthorizationAndSetHeader()
        expect(result).to.be.undefined

        scope.done()
      })

      it('should throw a error occurs', async () => {
        const scope = nock("https://" + config.get('docusign').oauthPath).post('/oauth/token').reply(500, mocks.mockToken)

        try {
          await docusign._setDocusignAuthorizationAndSetHeader()
        } catch (error) {
          expect(error).to.be.an.instanceof(Error)
        }
        scope.done()
      })
    })

    describe('_buildNotifyWebhook', () => {
      it('should return a webhook config', async () => {
        const accountRequestId = 'xpto'
        const connectJWT = jwt.encode({ id: 'xpto' })
        const connectUrl = `${config.get('protocol')}://${config.get('domain')}/v1/webhooks/docusign/connect/${accountRequestId}/contract/${connectJWT}`

        const expected = {
          url: connectUrl,
          loggingEnabled: "true",
          includeCertificateOfCompletion: "false",
          includeDocuments: "false",
          includeDocumentFields: "false",
          requireAcknowledgment: "false",
          envelopeEvents: [
            { envelopeEventStatusCode: "sent" },
            { envelopeEventStatusCode: "delivered" },
            { envelopeEventStatusCode: "completed" },
            { envelopeEventStatusCode: "declined" },
            { envelopeEventStatusCode: "voided" },
          ],
          recipientEvents: [
            { recipientEventStatusCode: "sent" },
            { recipientEventStatusCode: "delivered" },
            { recipientEventStatusCode: "completed" },
            { recipientEventStatusCode: "declined" },
          ]
        }

        const result = docusign._buildEventNotification('xpto')
        expect(result).not.to.be.undefined
        expect(result).to.deep.equal(expected)
      })
    })
  })
})
