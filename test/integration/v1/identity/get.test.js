const config = require('../../../../config')
const microblink = require('../../../support/mock/microblink')

describe('GET /prospects/identities/:driverLicenseFrontDocumentId/:driverLicenseBackDocumentId', () => {
  let frontDocId, backDocId

  before(() => {
    nock.enable()
  })

  beforeEach(async () => {
    frontDocId = 'a74f9092-5889-430a-9c19-6712f9f68090'
    backDocId = 'a74f9092-5889-430a-9c19-6712f9f68091'
    await Promise.all([
      seed.document.create(frontDocId),
      seed.document.create(backDocId)
    ])

    const imageContent = 'iaa'
    const match = _.matches({ recognizerType: 'USDL', imageBase64: 'aWFh' })
    nock(config.get('microblink').baseUrl)
      .post('/recognize/execute', match)
      .reply(200, microblink.successResponse)

    const bucket = config.get('aws').s3_upload_bucket
    nock(config.get('aws').s3_endpoint)
      .get(`/${bucket}/${frontDocId}.png`)
      .reply(200, imageContent)
    nock(config.get('aws').s3_endpoint)
      .get(`/${bucket}/${backDocId}.png`)
      .reply(200, imageContent)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  after(() => {
    nock.enableNetConnect()
  })

  it('should return json', () => {
    return request(app.server)
      .get(`/v1/prospects/identities/${frontDocId}/${backDocId}`)
      .expect('Content-Type', /json/)
  })

  it('should return 200', () => {
    return request(app.server)
      .get(`/v1/prospects/identities/${frontDocId}/${backDocId}`)
      .expect(200)
  })

  it('should return a identity', () => {
    const expected = blueprints.identity.get()
    return request(app.server)
      .get(`/v1/prospects/identities/${frontDocId}/${backDocId}`)
      .expect(expected)
  })

  it('should return a identity model', () => {
    const props = [
      'firstName', 'middleName', 'lastName', 'address', 'city',
      'state', 'zipCode', 'dateOfBirth', 'documentNumber',
      'documentExpirationDate', 'documentIssuedDate', 'documentIssuer'
    ]
    return request(app.server)
      .get(`/v1/prospects/identities/${frontDocId}/${backDocId}`)
      .expect(res => {
        props.forEach(prop => {
          expect(res.body).to.have.own.property(prop)
        })
        expect(res.body.firstName).to.be.an('string')
        expect(res.body.middleName).to.be.an('string')
        expect(res.body.lastName).to.be.an('string')
        expect(res.body.address).to.be.an('string')
        expect(res.body.city).to.be.an('string')
        expect(res.body.state).to.be.an('string')
        expect(res.body.zipCode).to.be.an('string')
        expect(res.body.dateOfBirth).to.be.an('string')
        expect(res.body.documentNumber).to.be.an('string')
        expect(res.body.documentExpirationDate).to.be.an('string')
        expect(res.body.documentIssuedDate).to.be.an('string')
        expect(res.body.documentIssuer).to.be.an('string')
      })
  })

  describe('when front driver document does not exist', () => {
    it('should return 404', () => {
      frontDocId = 'a74f9092-5889-430a-9c19-6712f9f68000'
      return request(app.server)
        .get(`/v1/prospects/identities/${frontDocId}/${backDocId}`)
        .expect(404)
    })
  })

  describe('when back driver document does not exist', () => {
    it('should return 404', () => {
      backDocId = 'a74f9092-5889-430a-9c19-6712f9f68000'
      return request(app.server)
        .get(`/v1/prospects/identities/${frontDocId}/${backDocId}`)
        .expect(404)
    })
  })

  describe('when back driver document is invalid uuid', () => {
    it('should return 400', () => {
      backDocId = 'invalid'
      return request(app.server)
        .get(`/v1/prospects/identities/${frontDocId}/${backDocId}`)
        .expect(400)
    })
  })

  describe('when front driver document is invalid uuid', () => {
    it('should return 400', () => {
      backDocId = 'invalid'
      return request(app.server)
        .get(`/v1/prospects/identities/${frontDocId}/${backDocId}`)
        .expect(400)
    })
  })
})
