const axios = require('axios')
const nock  = require('nock')
const config = require('../../../config')
axios.defaults.adapter = require('axios/lib/adapters/http')

const microblink = require('../../../app/plugins/microblink')
const mocks = require('../../support/mock/microblink')

describe('MicroblinkService', () => {
  const service = microblink
  const userData = {
    selfie: 'test/asset/sample.jpg',
    frontIdProof: 'test/asset/sample.jpg',
    backIdProof: 'test/asset/sample.jpg',
    firstName: 'Sample',
    lastName: 'Specimen',
    dateOfBirth: '1978-03-13',
    fullAddress: '123 main street apt. 1\norlando, fl 17101-0000',
    email: 'john@wearesingular.com',
    documentNumber: 'S123-456-78-123-0',
  }

  describe('given a valid data', () => {
    beforeEach(() => {
      nock.disableNetConnect()
      nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should receive data from microblink', async () => {
      const response = mocks.successResponse

      const scope = nock(config.get('microblink').baseUrl)
        .post('/recognize/execute')
        .reply(200, response)

      const result = await service.sendDocumentToMicroblink(userData.frontIdProofDocument)

      expect(result).to.have.deep.property('code', 'OK')
      expect(result.data.result).to.have.deep.property('firstName', userData.firstName.toUpperCase())
      expect(result.data.result).to.have.deep.property('lastName', userData.lastName.toUpperCase())
      expect(result.data.result).to.have.deep.property('address', userData.fullAddress.toUpperCase())
      expect(result.data.result).to.have.deep.property('documentNumber', userData.documentNumber.toUpperCase())

      scope.done()
    })

    it('should be able to parse response', async () => {
      const response = {
        data: {
          result: {
            firstName: 'SAMPLE',
            lastName: 'SPECIMEN',
            fullName: '',
            address: '123 MAIN STREET APT. 1\nORLANDO, FL 17101-0000',
            dateOfBirth: {
              day: 18,
              month: 3,
              year: 1990,
              originalString: '03/18/1990',
            },
            dateOfIssue: {
              day: 18,
              month: 3,
              year: 2018,
              originalString: '03/18/2018',
            },
            dateOfExpiry: {
              day: 18,
              month: 3,
              year: 2025,
              originalString: '03/18/2025',
            },
            documentNumber: 'S123-456-78-123-0',
            sex: 'M',
            additionalNameInformation: '',
            additionalAddressInformation: '',
            placeOfBirth: '',
            nationality: '',
            race: '',
            religion: '',
            profession: '',
            maritalStatus: '',
            residentialStatus: '',
            employer: '',
            personalIdNumber: '',
            documentAdditionalNumber: '',
            issuingAuthority: '',
            conditions: '',
            type: 'BLINK_ID',
          },
        },
      }

      const scope = nock(config.get('microblink').baseUrl)
        .post('/recognize/execute')
        .reply(200, response)

      const returnedData = await service.sendDocumentToMicroblink(userData.frontIdProofDocument)
      const result = service.getBasicUserDataFromMicroblinkResponse(returnedData.data.result)

      expect(result).to.have.deep.property('firstName', userData.firstName)
      expect(result).to.have.deep.property('lastName', userData.lastName)
      expect(result).to.have.deep.property('address', '123 main street apt. 1')
      expect(result).to.have.deep.property('dateOfBirth', '1990-03-18')
      expect(result).to.have.deep.property('documentNumber', userData.documentNumber)
      expect(result).to.have.deep.property('documentExpirationDate', '2025-03-18')
      expect(result).to.have.deep.property('documentIssuedDate', '2018-03-18')
      expect(result).to.have.deep.property('documentIssuedDate', '2018-03-18')
      expect(result).to.have.deep.property('documentExpirationDate', '2025-03-18')

      scope.done()
    })
  })

  describe('when parsing data with getBasicUserDataFromMicroblinkResponse', () => {
    it('should split names with 3 words', async () => {
      const response = {
        data: {
          recognizer: 'BLINK_ID',
          result: {
            firstName: 'MARK JAMES',
            lastName: 'BROWN',
            fullName: '',
            type: 'BLINK_ID',
            customerMiddleName: '',
          },
        },
      }

      const result = service.getBasicUserDataFromMicroblinkResponse(response.data.result)
      expect(result).to.have.deep.property('firstName', 'Mark')
      expect(result).to.have.deep.property('middleName', 'James')
      expect(result).to.have.deep.property('lastName', 'Brown')
    })


    it('should return basic structure', async () => {
      const response = {
        data: {
          recognizer: 'BLINK_ID',
          result: null
        },
      }

      const result = service.getBasicUserDataFromMicroblinkResponse(response.data.result)
      expect(result).to.have.deep.property('dateOfBirth', null)
      expect(result).to.have.deep.property('middleName', '')
      expect(result).to.have.deep.property('lastName', '')
      expect(result).to.have.deep.property('documentNumber', '')
      expect(result).to.have.deep.property('documentIssuedDate', null)
    })


    it('should split dates correctly', async () => {
      const response = {
        data: {
          recognizer: 'BLINK_ID',
          result: {
            dateOfBirth: {
              day: 18,
              month: 3,
              year: 1990,
              originalString: '03/18/1990',
            },
            type: 'BLINK_ID',
          },
        },
      }

      const result = service.getBasicUserDataFromMicroblinkResponse(response.data.result)
      expect(result).to.have.deep.property('dateOfBirth', '1990-03-18')
    })

    it('should split more complex addresses for BLINK_ID', async () => {
      const response = {
        data: {
          recognizer: 'BLINK_ID',
          result: {
            address: '1234 FOWLER AVE\nATLANTA, GA 12345-1234\nFULTON',
            documentNumber: 'S123-456-78-123-0',
            sex: 'M',
            type: 'BLINK_ID',
          },
        },
      }

      const result = service.getBasicUserDataFromMicroblinkResponse(response.data.result)
      expect(result).to.have.deep.property('address', '1234 fowler ave')
      expect(result).to.have.deep.property('city', 'Atlanta')
      expect(result).to.have.deep.property('state', 'GA')
      expect(result).to.have.deep.property('zipCode', '12345-1234')
    })

    it('should not split addresses', async () => {
      const response = {
        data: {
          recognizer: 'BLINK_ID',
          result: {
            address: '1234 FOWLER AVE ATLANTA',
            documentNumber: 'S123-456-78-123-0',
            sex: 'M',
            type: 'BLINK_ID',
          },
        },
      }

      const result = service.getBasicUserDataFromMicroblinkResponse(response.data.result)
      expect(result).to.have.deep.property('address', '1234 fowler ave atlanta')
      expect(result).to.have.deep.property('city', '')
      expect(result).to.have.deep.property('state', '')
      expect(result).to.have.deep.property('zipCode', '')
    })

    it('should be able to parse MRTD fields ', async () => {
      const scope = nock(config.get('microblink').baseUrl)
        .post('/recognize/execute')
        .reply(200, mocks.successMRTD)

      const returnedData = await service.sendDocumentToMicroblink(userData.frontIdProofDocument)
      const result = service.getBasicUserDataFromMicroblinkResponse(returnedData.data.result)

      expect(result).to.have.deep.property('firstName', 'James')
      expect(result).to.have.deep.property('middleName', 'Michael')
      expect(result).to.have.deep.property('lastName', 'Bond')
      expect(result).to.have.deep.property('dateOfBirth', '1982-06-16')
      expect(result).to.have.deep.property('documentNumber', '123928201ZY8')
      expect(result).to.have.deep.property('documentExpirationDate', '2020-04-09')

      scope.done()
    })

  })

  describe('given a incomplete valid data', () => {
    const response = {
      code: 'OK',
      summary: 'The results have been successfully retrieved!',
      executionId: 'a74f9092-5889-430a-9c19-6712f9f68383',
      data: {
        recognizer: 'BLINK_ID',
        version: '2.8.1',
        startTime: '2019-11-20T12:47:46.922Z',
        finishTime: '2019-11-20T12:47:47.294Z',
        durationTimeInSeconds: 0.372,
        taskId: 39,
        workerId: 1,
        result: {
          firstName: '',
          lastName: '',
          fullName: '',
          address: 'McLOVIN\n892 MOMONA ST\nHONOLULU, HI 96820',
          dateOfBirth: {
            day: 3,
            month: 6,
            year: 1981,
            originalString: '06/03/1981EXP06/03/2008',
          },
          dateOfIssue: {
            day: null,
            month: null,
            year: null,
            originalString: null,
          },
          dateOfExpiry: {
            day: null,
            month: null,
            year: null,
            originalString: null,
          },
          documentNumber: '',
          sex: '150',
          additionalNameInformation: '',
          additionalAddressInformation: '',
          placeOfBirth: '',
          nationality: '',
          race: '',
          religion: '',
          profession: '',
          maritalStatus: '',
          residentialStatus: '',
          employer: '',
          personalIdNumber: '',
          documentAdditionalNumber: '',
          issuingAuthority: '',
          conditions: '',
          type: 'BLINK_ID',
        },
      },
    }

    beforeEach(() => {
      nock.disableNetConnect()
      nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should ocr data', async () => {
      const scope = nock(config.get('microblink').baseUrl)
        .post('/recognize/execute')
        .reply(200, response)

      const result = await service.sendDocumentToMicroblink(userData.frontIdProofDocument)

      expect(result).to.have.deep.property('code', 'OK')
      expect(result.data.result).to.have.deep.property('firstName', '')
      expect(result.data.result).to.have.deep.property('lastName', '')
      expect(result.data.result).to.have.deep.property('address', 'McLOVIN\n892 MOMONA ST\nHONOLULU, HI 96820')
      expect(result.data.result).to.have.deep.property('documentNumber', '')

      scope.done()
    })

    it('should be able to parse null response', async () => {
      const scope = nock(config.get('microblink').baseUrl)
        .post('/recognize/execute')
        .reply(200, response)

      const returnedData = await service.sendDocumentToMicroblink(userData.frontIdProofDocument)
      const result = service.getBasicUserDataFromMicroblinkResponse(returnedData.data.result)

      expect(result).to.have.deep.property('firstName', '')
      expect(result).to.have.deep.property('lastName', '')
      expect(result).to.have.deep.property('address', 'Mclovin')
      expect(result).to.have.deep.property('city', '892 momona s')
      expect(result).to.have.deep.property('state', '92 MOMONA')
      expect(result).to.have.deep.property('dateOfBirth', '1981-06-03')
      expect(result).to.have.deep.property('documentIssuedDate', null)
      expect(result).to.have.deep.property('documentExpirationDate', null)

      scope.done()
    })
  })

  describe('when parsing USDL data', () => {
    it('should split date with american format', async () => {
      const response = {
        data: {
          recognizer: 'USDL',
          result: {
            uncertain: false,
            firstName: 'SAMPLE',
            lastName: 'SPECIMEN',
            fullName: 'SPECIMEN,SAMPLE',
            address: '123 MAIN STREET, PHOENIX, AZ, 850071234',
            dateOfBirth: '03181990',
            dateOfIssue: {
              day: 18,
              month: 3,
              year: 2018,
              originalString: '03182018',
            },
            dateOfExpiry: {
              day: 18,
              month: 3,
              year: 2025,
              originalString: '03182025',
            },
            documentNumber: 'D12345678',
            sex: '2',
            restrictions: 'NONE',
            endorsements: 'NONE',
            vehicleClass: 'D',
            documentType: 'AAMVA',
            standardVersionNumber: '8',
            customerFamilyName: 'SPECIMEN',
            customerFirstName: 'SAMPLE',
            customerFullName: 'SPECIMEN,SAMPLE',
            eyeColor: 'BRO',
            addressStreet: '123 MAIN STREET',
            addressCity: 'PHOENIX',
            addressJurisdictionCode: 'AZ',
            addressPostalCode: '850071234',
            fullAddress: '123 MAIN STREET, PHOENIX, AZ, 850071234',
            height: '68 in',
            heightIn: '68',
            heightCm: '173',
            customerMiddleName: 'JOHN',
            hairColor: 'BRO',
            countryIdentification: 'USA',
            complianceType: 'N',
            type: 'USDL',
          },
        },
      }

      const result = service.getBasicUserDataFromMicroblinkResponse(response.data.result)
      expect(result).to.have.deep.property('firstName', 'Sample')
      expect(result).to.have.deep.property('middleName', 'John')
      expect(result).to.have.deep.property('lastName', 'Specimen')
      expect(result).to.have.deep.property('address', '123 main street')
      expect(result).to.have.deep.property('city', 'Phoenix')
      expect(result).to.have.deep.property('state', 'AZ')
      expect(result).to.have.deep.property('zipCode', '850071234')
      expect(result).to.have.deep.property('dateOfBirth', '1990-03-18')
      expect(result).to.have.deep.property('documentIssuedDate', '2018-03-18')
      expect(result).to.have.deep.property('documentExpirationDate', '2025-03-18')
    })

    it('should get the issued state for AAMVA card', async () => {
      const result = service.getBasicUserDataFromMicroblinkResponse(mocks.successUSDLAAMVABack.data.result)

      expect(result).to.have.deep.property('firstName', 'Sample')
      expect(result).to.have.deep.property('middleName', '')
      expect(result).to.have.deep.property('lastName', 'Microblink')

      expect(result).to.have.deep.property('documentIssuer', 'ZT')
      expect(result).to.have.deep.property('documentNumber', '')
      expect(result).to.have.deep.property('documentExpirationDate', '2020-07-01')
      expect(result).to.have.deep.property('documentIssuedDate', '2014-07-09')

      expect(result).to.have.deep.property('address', '4151 west yoakum ave')
      expect(result).to.have.deep.property('city', 'Kingsville')
      expect(result).to.have.deep.property('state', 'TX')
      expect(result).to.have.deep.property('zipCode', '78363')
      expect(result).to.have.deep.property('dateOfBirth', '1980-07-01')
    })

    it('should not get the issued state for blink_id card', async () => {
      const result = service.getBasicUserDataFromMicroblinkResponse(mocks.successResponse.data.result)

      expect(result).to.have.deep.property('firstName', 'Sample')
      expect(result).to.have.deep.property('middleName', '')
      expect(result).to.have.deep.property('lastName', 'Specimen')

      expect(result).to.have.deep.property('documentIssuer', '')
      expect(result).to.have.deep.property('documentNumber', 'S123-456-78-123-0')
      expect(result).to.have.deep.property('documentExpirationDate', '2025-03-18')
      expect(result).to.have.deep.property('documentIssuedDate', '2018-03-18')

      expect(result).to.have.deep.property('address', '123 main street apt. 1')
      expect(result).to.have.deep.property('city', 'Orlando')
      expect(result).to.have.deep.property('state', 'FL')
      expect(result).to.have.deep.property('zipCode', '17101-0000')
      expect(result).to.have.deep.property('dateOfBirth', '1990-03-18')
    })
  })

  describe('given a invalid data', () => {
    beforeEach(() => {
      nock.disableNetConnect()
      nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should throw a HttpException when a error occurs', async () => {
      const response = {
        code: 'IMAGE_IS_NOT_VALID_BASE64_STRING',
        summary: 'Error, imageBase64 is not able to decode!',
      }

      const scope = nock(config.get('microblink').baseUrl)
        .post('/recognize/execute')
        .reply(400, response)

      try {
        await service.sendDocumentToMicroblink(userData.frontIdProofDocument)
      } catch (error) {

        expect(error).to.not.be.undefined
        expect(error.response.status).to.equal(400)
        expect(error.response.data.code).to.equal(response.code)
        expect(error.response.data.summary).to.equal(response.summary)
      }
      scope.done()
    })
  })

  describe('when sendDocumentsForOCR scans a card', () => {

    beforeEach(() => {
      nock.disableNetConnect()
      nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should scan USDL first', async () => {
      const scope = nock(config.get('microblink').baseUrl)
        .post('/recognize/execute')
        .reply(200, mocks.successResponse)
      const result = await service.sendDocumentsForOCR(userData)

      expect(result).to.have.deep.property('code', 'OK')
      expect(result.data).to.have.deep.property('recognizer', 'BLINK_ID')
      expect(result.data.result).to.have.deep.property('lastName', 'SPECIMEN')

      scope.done()
    })

    it('should scan BLINK_ID last', async () => {
      const scopeA = nock(config.get('microblink').baseUrl)
        .post('/recognize/execute')
        .once()
        .reply(200, mocks.failedMRTD)

      const scopeB = nock(config.get('microblink').baseUrl)
        .post('/recognize/execute')
        .once()
        .reply(200, mocks.successResponse)

      const result = await service.sendDocumentsForOCR(userData)

      expect(result).to.have.deep.property('code', 'OK')
      expect(result.data).to.have.deep.property('recognizer', 'BLINK_ID')
      expect(result.data.result).to.have.deep.property('lastName', 'SPECIMEN')

      scopeA.done()
      scopeB.done()
    })
  })

})
