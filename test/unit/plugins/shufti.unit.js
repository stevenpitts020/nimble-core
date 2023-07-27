const axios = require('axios')
const nock = require('nock')
const mocks = require('../../support/mock/shufti')
const shufti = require('../../../app/plugins/shufti')

const config = require('../../../config')
axios.defaults.adapter = require('axios/lib/adapters/http')

describe('Service', () => {

  beforeEach(() => {
    nock.disableNetConnect()
    nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
  })

  afterEach(() => { nock.cleanAll() })

  describe('buildRequestPayload', () => {
    it('should return a valid payload', () => {
      const userData = {
        selfie: 'test/asset/sample.jpg',
        idProofType: 'USDL',
        frontIdProof: 'test/asset/sample.jpg',
        backIdProof: 'test/asset/sample.jpg',
        firstName: 'John',
        middleName: 'Carter',
        lastName: 'Doe',
        dateOfBirth: '1978-03-13',
        documentIssuedDate: '1988-03-13',
        fullAddress: '3339 Maryland Avenue, Largo, Florida',
        email: 'john@wearesingular.com',
      }

      const result = shufti.buildRequestPayload(userData)

      expect(result).not.to.be.undefined
      expect(result.document).not.to.be.undefined
      expect(result.face).not.to.be.undefined
      expect(result.address).not.to.be.undefined
      expect(result.document.name.first_name).to.equal(userData.firstName)
      expect(result.document.dob).to.equal(userData.dateOfBirth)
      expect(result.document.issue_date).to.equal(userData.documentIssuedDate)
      expect(result.face.allow_offline).to.equal('1')
      expect(result.document.supported_types).to.deep.equal(['driving_license'])
    })

    it('should return a valid payload for document type PASSPORT', () => {
      const userData = {
        selfie: 'test/asset/sample.jpg',
        idProofType: 'PASSPORT',
        frontIdProof: 'test/asset/sample.jpg',
        backIdProof: null,
        firstName: 'John',
        middleName: 'Carter',
        lastName: 'Doe',
        dateOfBirth: '1978-03-13',
        documentIssuedDate: '1988-03-13',
        fullAddress: '3339 Maryland Avenue, Largo, Florida',
        email: 'john@wearesingular.com',
      }

      const result = shufti.buildRequestPayload(userData)
      expect(result).not.to.be.undefined
      expect(result.document).not.to.be.undefined
      expect(result.face).not.to.be.undefined
      expect(result.address).not.to.be.undefined
      expect(result.document.name.first_name).to.equal(userData.firstName)
      expect(result.document.dob).to.equal(userData.dateOfBirth)
      expect(result.document.issue_date).to.equal(userData.documentIssuedDate)
      expect(result.face.allow_offline).to.equal('1')
      expect(result.document.supported_types).to.deep.equal(['passport'])
    })

    it(' should use my signerId in the payload as reference', () => {
      const userData = {
        selfie: 'test/asset/sample.jpg',
        idProofType: 'USDL',
        frontIdProofDocument: 'test/asset/sample.jpg',
        backIdProofDocument: 'test/asset/sample.jpg',
        firstName: 'John',
        middleName: 'Carter',
        lastName: 'Doe',
        dateOfBirth: '1978-03-13',
        documentIssuedDate: '1988-03-13',
        fullAddress: '3339 Maryland Avenue, Largo, Florida',
        email: 'john@wearesingular.com',
      }
      const result = shufti.buildRequestPayload(userData, 'silly_rabbit')

      expect(result).not.to.be.undefined
      expect(result.reference).to.equal('silly_rabbit')
    })
  })

  describe('getPayload', () => {
    it('should return a valid payload', () => {
      const result = shufti.getPayload('test@wearesingular.com', 'xpto')
      expect(result).not.to.be.undefined
      expect(result.reference).to.equal('xpto')
      expect(result.email).to.equal('test@wearesingular.com')
    })

    it('should return a payload without email', () => {
      const result = shufti.getPayload(null, 'xpto')
      expect(result).not.to.be.undefined
      expect(result.reference).to.equal('xpto')
      expect(result.email).be.undefined
    })
  })

  // this makes actual api call
  describe('getDocumentVerification', () => {
    const userData = {
      selfie: 'test/asset/sample.jpg',
      idProofType: 'USDL',
      frontIdProofDocument: 'test/asset/sample.jpg',
      backIdProofDocument: 'test/asset/sample.jpg',
      firstName: 'John',
      middleName: 'Carter',
      lastName: 'Doe',
      dateOfBirth: '1978-03-13',
      documentIssuedDate: '1988-03-13',
      fullAddress: '3339 Maryland Avenue, Largo, Florida',
      email: 'john@wearesingular.com'
    }

    describe('given a valid user data', () => {
      it('should return reasons for verification.accepted', async () => {
        const response = { ...mocks.verificationAccepted }

        const scope = nock(config.get('shufti').baseUrl)
          .post('/api/')
          .reply(200, response)

        const result = await shufti.getUserVerification(userData, mocks.verificationAccepted.reference)

        expect(result).to.have.deep.property('event', response.event)
        expect(result).to.have.deep.property('verification_result', response.verification_result)

        scope.done()
      })
    })

    describe('given a invalid data', () => {
      it('should throw a HttpException when a error occurs', async () => {
        const response = { ...mocks.requestInvalid }
        const scope = nock(config.get('shufti').baseUrl).post('/api/').reply(400, response)

        try {
          await shufti.getUserVerification(userData)
        } catch (error) {
          expect(error).to.be.an.instanceof(Error)
          expect(error.response).to.have.property('status', 400)
          expect(error.response.data).to.have.deep.property('error', response.error)
        }
        scope.done()
      })
    })
  })
})
