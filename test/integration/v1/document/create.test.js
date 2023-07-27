const config = require('../../../../config')

describe('POST /documents', () => {
  let document, clock, aws

  before(() => {
    clock = sinon.useFakeTimers({ toFake: ['Date'] })
    nock.enable({ s3: false })
  })

  beforeEach(() => {
    document = {
      format: 'image',
      institutionId: '016099fd-dcce-49ac-87db-b54d5426242e',
      content: 'isomebase64'
    }

    aws = config.get('aws')
    nock(aws.s3_endpoint)
      .put(/test-uploads/)
      .reply(200)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  after(() => {
    clock.restore()
    nock.enableNetConnect()
  })

  it('should return json', () => {
    return request(app.server)
      .post('/v1/documents')
      .send(document)
      .expect('Content-Type', /json/)
  })

  it('should return 201', () => {
    return request(app.server)
      .post('/v1/documents')
      .send(document)
      .expect(201)
  })

  it('should return a document', () => {
    const expected = blueprints.document.get('1')
    return request(app.server)
      .post('/v1/documents')
      .send(document)
      .expect(res => {
        expected.id = _.get(res, 'body.id')
        expect(res.body).to.deep.eq(expected)
      })
  })

  it('should return a document model', () => {
    return request(app.server)
      .post('/v1/documents')
      .send(document)
      .expect(res => {
        ['id', 'format', 'createdAt'].forEach(prop => {
          expect(res.body).to.have.own.property(prop)
        })

        expect(res.body).not.to.have.own.property('updatedAt')
        expect(res.body).not.to.have.own.property('content')

        expect(res.body.id).to.be.an('string')
        expect(res.body.format).to.be.an('string')
        expect(res.body.createdAt).to.be.an('string')
      })
  })

  it('should persist the document metadata', (done) => {
    request(app.server)
      .post('/v1/documents')
      .send(document)
      .end((err, res) => {
        if (err) throw new Error(err)

        // check if metadata was persisted
        const id = res.body.id
        knex('documents').where('id', id).count()
          .then(count => {
            const expected = { count: "1" }
            const actual = _.first(count)
            expect(actual).to.be.eql(expected)
            done()
          })
          .catch(done)
      })
  })

  describe('when aws upload fails', () => {
    beforeEach(() => {
      nock.cleanAll()
      nock(aws.s3_endpoint)
        .put(/test-uploads/)
        .reply(500)
    })

    it('should not persist the document metadata', (done) => {
      request(app.server)
        .post('/v1/documents')
        .send(document)
        .end((err) => {
          if (err) throw new Error(err)

          knex('documents').count()
            .then(count => {
              const expected = { count: "0" }
              const actual = _.first(count)
              expect(actual).to.be.eql(expected)
              done()
            })
            .catch(done)
        })
    })
  })

  it('should persist the document', () => {
    return request(app.server)
      .post('/v1/documents')
      .send(document)
      .expect(201)
      .expect(() => {
        expect(nock.isDone()).to.be.eq(true, 'AWS S3 not called')
      })
  })

  describe('when format is a image', () => {
    it('should return 201', () => {
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect(201)
    })
  })

  describe('when format is a pdf', () => {
    it('should return 201', () => {
      document.format = 'pdf'
      document.content = 'somethingelse'
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect(201)
    })

    it('should persist the document', () => {
      document.format = 'pdf'
      document.content = 'somethingelse'
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect(201)
        .expect(() => {
          expect(nock.isDone()).to.be.eq(true, 'AWS S3 not called')
        })
    })
  })

  describe('when content not present', () => {
    beforeEach(() => document = _.omit(document, 'content'))

    it('should return 400', () => {
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect(400)
    })

    it('should return a error message', () => {
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect((res) => {
          expect(res.body.message).to.contain('"content" is required')
        })
    })
  })

  describe('when content is not a string', () => {
    beforeEach(() => document.content = 1)

    it('should return 400', () => {
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect(400)
    })

    it('should return a error message', () => {
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect((res) => {
          expect(res.body.message).to.contain('"content" must be a string')
        })
    })
  })

  describe('when format not present', () => {
    beforeEach(() => document = _.omit(document, 'format'))

    it('should return 400', () => {
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect(400)
    })

    it('should return a error message', () => {
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect((res) => {
          expect(res.body.message).to.contain('"format" is required')
        })
    })
  })

  describe('when format invalid', () => {
    it('should return 400', () => {
      document.format = 'invalidformat'
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect(400)
    })

    it('should return a error message', () => {
      document.format = 'invalidformat'
      return request(app.server)
        .post('/v1/documents')
        .send(document)
        .expect((res) => {
          expect(res.body.message).to.contain('"format" must be one of [image, pdf]')
        })
    })
  })
})
