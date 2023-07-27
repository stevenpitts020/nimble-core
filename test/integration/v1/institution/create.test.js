describe('POST /institutions', () => {
  let institution, newInstitution

  beforeEach(() => {
    institution = blueprints.institution.get('2552ab85-08da-4bb5-be00-9e94d282d311')

    sinon.replace(app.plugins.aws, 's3ImgUpload', () => Promise.resolve('https://wearesingular.com/img/example.png'))

    newInstitution = _.omit({
      ...institution,
      email: 'hello@wearesingular.com',
      logo: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+C/zAgAEJwIF4KuppQAAAABJRU5ErkJggg==',
      backgroundImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+C/zAgAEJwIF4KuppQAAAABJRU5ErkJggg==',
    }, ['backgroundImageUri', 'logoUri'])
  })

  afterEach(() => sinon.restore())

  it('should return 401 when apikey not present', () => {
    return request(app.server)
      .post('/v1/institutions')
      .send(newInstitution)
      .expect('Content-Type', /json/)
      .expect(401)
  })

  describe('when entity invalid', () => {
    it('should return 400', () => {
      return request(app.server)
        .post('/v1/institutions')
        .set('X-API-KEY', 'superpowers')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400)
    })

    it('should return error details', () => {
      return request(app.server)
        .post('/v1/institutions')
        .set('X-API-KEY', 'superpowers')
        .send({})
        .expect((res) => {
          expect(res.body.message).not.to.be.undefined
          expect(res.body.message).not.to.contain('"id" is required')
          expect(res.body.message).to.contain('"name" is required')
          expect(res.body.message).to.contain('"domain" is required')
          expect(res.body.message).to.contain('"logo" is required')
          expect(res.body.message).to.contain('"backgroundImage" is required')
        })
    })
  })

  it('should return 201', () => {
    return request(app.server)
      .post('/v1/institutions')
      .set('X-API-KEY', 'superpowers')
      .send(newInstitution)
      .expect('Content-Type', /json/)
      .expect(201)
  })

  it('should return a institution', () => {
    return request(app.server)
      .post('/v1/institutions')
      .set('X-API-KEY', 'superpowers')
      .send(newInstitution)
      .expect('Content-Type', /json/)
      .expect(res => {
        const expected = blueprints.institution.get('2552ab85-08da-4bb5-be00-9e94d282d311')
        expected.id = res.body.id
        expect(_.omit(res.body,['branchesCount'])).to.be.eql(expected)
      })
  })

  it('should return a institution model', () => {
    return request(app.server)
      .post('/v1/institutions')
      .set('X-API-KEY', 'superpowers')
      .send(newInstitution)
      .expect('Content-Type', /json/)
      .expect(res => {
        let props = ['id', 'slug', 'name', 'domain', 'logoUri', 'backgroundImageUri']

        props.forEach(prop => {
          expect(res.body).to.have.own.property(prop)
        })

        expect(res.body).not.to.have.own.property('updatedAt')
        expect(res.body).not.to.have.own.property('createdAt')

        expect(res.body.id).to.be.an('string')
        expect(res.body.slug).to.be.an('string')
        expect(res.body.name).to.be.an('string')
        expect(res.body.domain).to.be.an('string')

        expect(res.body.logoUri).to.be.an('object')
        expect(res.body.logoUri).to.have.own.property('default')
        expect(res.body.backgroundImageUri).to.be.an('object')
        expect(res.body.backgroundImageUri).to.have.own.property('default')
      })
  })

  it('should persist institution', (done) => {
    request(app.server)
      .post('/v1/institutions')
      .set('X-API-KEY', 'superpowers')
      .send(newInstitution)
      .expect('Content-Type', /json/)
      .end((err) => {
        if (err) done(err)

        request(app.server)
          .get('/v1/institutions/' + institution.domain)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(done)
      })
  })

  describe('when entity exists', () => {
    beforeEach(() => seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311'))

    it('should return 409', () => {
      return request(app.server)
        .post('/v1/institutions')
        .set('X-API-KEY', 'superpowers')
        .send(newInstitution)
        .expect('Content-Type', /json/)
        .expect(409)
    })
  })
})
