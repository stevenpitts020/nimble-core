const AWS = require("../../../../app/plugins/aws")
const sinon = require('sinon')

describe("AWS Facade for s3", () => {
  const sandbox = sinon.createSandbox()
  const blueSquare = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkSP/0HwAEIgJaKSK+YQAAAABJRU5ErkJggg=='
  // const fakePdf = Buffer.from([8, 6, 7, 5, 3, 0, 9])

  before(() => {
    sandbox.replace(AWS, 'uuid', () => '00000000-0000-0000-0000-000000000000')
    sandbox.spy(AWS, 'uuid')
    sandbox.spy(AWS.s3, 'putObject')
    sandbox.spy(AWS.s3, 'copyObject')
    sandbox.spy(AWS.s3, 'getSignedUrl')
  })

  afterEach(() => sandbox.reset())
  after(() => sandbox.restore())

  describe('s3Copy()', () => {

    beforeEach(async () => {
      await AWS.s3ImgUpload(blueSquare, 'folder')
    })

    it('should exist', () => {
      expect(AWS.s3CopyToFTP).not.to.be.undefined
      expect(AWS.s3CopyToFTP).to.be.an('function')
    })

    it('should return a promise', async () => {
      let result = AWS.s3CopyToFTP("folder/00000000-0000-0000-0000-000000000000.png", "destination/example.png")
      expect(result).to.be.an('Promise')
    })

    it('should return a path to the destination object', async () => {
      let result = await AWS.s3CopyToFTP("folder/00000000-0000-0000-0000-000000000000.png", "destination/example.png")
      expect(result).to.contain('/test-uploads/destination/example.png')
    })

    it('should call real s3 method', async () => {
      await AWS.s3CopyToFTP("folder/00000000-0000-0000-0000-000000000000.png", "destination/example.png")
      expect(AWS.s3.copyObject).to.have.been.called
    })
  })

  describe('s3ImgUpload()', () => {
    it('should exist', () => {
      expect(AWS.s3ImgUpload).not.to.be.undefined
      expect(AWS.s3ImgUpload).to.be.an('function')
    })

    it('should return a promise', () => {
      let result = AWS.s3ImgUpload(blueSquare)
      expect(result).to.be.an('Promise')
    })

    it('should fail if not uploading an image', () => {
      expect(() => {
        return AWS.s3ImgUpload('folder', 'just a string')
      }).to.throw()
    })

    describe('image validation based on first character', () => {
      it('should support png', () => {
        expect(() => AWS.s3ImgUpload('iPNG')).not.to.throw()
      })
      it('should support jpg', () => {
        expect(() => AWS.s3ImgUpload('/JPG')).not.to.throw()
      })
      it('should support gif', () => {
        expect(() => AWS.s3ImgUpload('RGIF')).not.to.throw()
      })
      it('should support webp', () => {
        expect(() => AWS.s3ImgUpload('UWEBP')).not.to.throw()
      })
    })

    it('should have error message', (done) => {
      try {
        AWS.s3ImgUpload('folder', 'just a string')
      } catch (err) {
        expect(err.message).to.equal('image base64 must be png/jpg/gif/webp')
        done()
      }
    })

    it('should support async/await', async () => {
      let result = await AWS.s3ImgUpload(blueSquare, 'folder')
      expect(result).to.contain(app.config.get('aws').s3_endpoint)
    })

    it('should call real s3 method', async () => {
      await AWS.s3ImgUpload(blueSquare, 'folder')
      expect(AWS.uuid).to.have.been.called
      expect(AWS.s3.putObject).to.have.been.called
    })

    it('should call real s3 without generating uuid', async () => {
      await AWS.s3ImgUpload(blueSquare, 'folder', '00000000-0000-0000-0000-000000000001')
      let expectedCall = {
        Body: sinon.match.any,
        Bucket: AWS.config.s3.upload_bucket,
        Key: 'folder/00000000-0000-0000-0000-000000000001.png',
      }
      expect(AWS.uuid).to.not.have.been.called
      expect(AWS.s3.putObject).to.have.been.calledWith(expectedCall)
    })

    it('should call real s3 with correct parameters', async () => {
      await AWS.s3ImgUpload(blueSquare, 'folder')
      let expectedCall = {
        Body: sinon.match.any,
        Bucket: AWS.config.s3.upload_bucket,
        Key: 'folder/00000000-0000-0000-0000-000000000000.png',
      }
      expect(AWS.uuid).to.have.been.called
      expect(AWS.s3.putObject).to.have.been.calledWith(expectedCall)
    })

    it('should return uploaded image url', async () => {
      let result = await AWS.s3ImgUpload(blueSquare, 'folder')
      expect(result).to.equal(`${app.config.get('aws').s3_endpoint}/test-uploads/folder/00000000-0000-0000-0000-000000000000.png`)
    })
  })

  describe('s3PresignedUrl()', () => {
    it('should exist', () => {
      expect(AWS.s3PresignedUrl).not.to.be.undefined
      expect(AWS.s3PresignedUrl).to.be.an('function')
    })

    it('should return a promise', () => {
      const result = AWS.s3PresignedUrl('id')
      expect(result).to.be.an('Promise')
    })

    it('should support async/await', async () => {
      const result = await AWS.s3PresignedUrl('id')
      expect(result).to.contain(app.config.get('aws').s3_endpoint)
    })

    it('should call real s3 method', async () => {
      await AWS.s3PresignedUrl('id')
      expect(AWS.s3.getSignedUrl).to.have.been.called
    })

    it('should call real s3 with correct parameters', async () => {
      await AWS.s3PresignedUrl('id')
      let expectedCall = {
        Bucket: AWS.config.s3.upload_bucket,
        Key: 'id',
        Expires: 60
      }
      expect(AWS.s3.getSignedUrl).to.have.been.calledWith('getObject', expectedCall)
    })
  })
})
