const AWS = require('../../../../app/plugins/aws')

describe('AWS Facade class', () => {
  it('should exist', () => {
    expect(AWS).not.to.be.undefined
  })

  it('should have configs', () => {
    expect(AWS.constructor.config).to.be.undefined
    expect(AWS.config).not.to.be.undefined //not static
  })

  it('should load configs', () => {
    expect(AWS.config.credentials.accessKeyId).to.equal('FAKE_ID')
    expect(AWS.config.credentials.secretAccessKey).to.equal('FAKE_SECRET')
  })

  it('should load specific service configs', () => {
    expect(AWS.config.s3).not.to.be.undefined
    expect(AWS.config.s3.endpoint).to.equal(app.config.get('aws').endpoint)
  })

  it('should not load empty config vars', () => {
    const target = new AWS.constructor({
      credentials: {
        accessKeyId: 'accessKeyId'
      },
      region: 'region',
      endpoint: '',
      s3: {
        endpoint: ''
      }
    })

    expect(target.config.region).not.to.be.undefined
    expect(target.config.region).to.equal('region')
    expect(target.config.credentials.accessKeyId).not.to.be.undefined
    expect(target.config.credentials.accessKeyId).to.equal('accessKeyId')

    expect(target.config.endpoint).to.be.undefined
    expect(target.config.s3.endpoint).to.be.undefined
  })

  it('should load s3 stuff when loading', () => {
    const target = new AWS.constructor({
      endpoint: 'endpoint',
      s3: {
        endpoint: 'endpointoverwrite'
      }
    })
    expect(target.config.endpoint).to.equal('endpoint')
    expect(target.s3.config.endpoint).to.equal('endpointoverwrite')
  })

  it('should expose SDK services preconfigured', () => {
    expect(AWS.s3).not.to.be.undefined
    expect(AWS.s3.config.endpoint).to.equal(app.config.get('aws').endpoint)
  })

  describe('S3 Facade', () => {
    it('should expose putObject method as s3ImgUpload()', () => {
      expect(AWS.s3ImgUpload).not.to.be.undefined
      expect(AWS.s3ImgUpload).to.be.an('function')
    })
  })

  describe('SES Facade', () => {
    it('should expose aws.SES.sendTemplatedEmail method as sendEmailTemplate()', () => {
      expect(AWS.sendEmailTemplate).not.to.be.undefined
      expect(AWS.sendEmailTemplate).to.be.an('function')
    })
  })
})
