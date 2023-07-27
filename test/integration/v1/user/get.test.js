describe('GET /users/:id', () => {
  let token

  describe('with invalid data', () => {
    it('should return 401 if not authenticated', done => {
      request(app.server)
        .get('/v1/users/1052ab85-08da-4bb5-be00-9e94d282d310')
        .expect('Content-Type', /json/)
        .expect(401)
        .end(done)
    })

    it('should return 400 if :id is not a uuid', done => {
      request(app.server)
        .get('/v1/users/string')
        .set('X-API-KEY', 'superpowers')
        .expect('Content-Type', /json/)
        .expect(400)
        .end(done)
    })

    it('should return 500 if :id is weird and breaks routing', done => {
      request(app.server)
        .get('/v1/users/(*&^*(&^%))')
        .set('X-API-KEY', 'superpowers')
        .expect('Content-Type', /json/)
        .expect(500)
        .end(done)
    })
  })

  describe('with valid data', () => {
    beforeEach(async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      token = await helpers.getAuthToken()
    })

    it('should return 401 if authenticated bearer token', async () => {
      return request(app.server)
        .get('/v1/users/1052ab85-08da-4bb5-be00-9e94d282d310')
        .set('Authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should return 200', done => {
      request(app.server)
        .get('/v1/users/1052ab85-08da-4bb5-be00-9e94d282d310')
        .set('X-API-KEY', 'superpowers')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(done)
    })

    it('should return valid user object', done => {
      request(app.server)
        .get('/v1/users/1052ab85-08da-4bb5-be00-9e94d282d310')
        .set('X-API-KEY', 'superpowers')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) throw new Error(err)

          const props = ['id', 'firstName', 'lastName', 'createdAt', 'email']

          props.forEach(prop => {
            expect(res.body).to.have.own.property(prop)
          })

          expect(res.body).not.to.have.own.property('updatedAt')

          expect(res.body.id).to.be.an('string')
          expect(res.body.firstName).to.be.an('string')
          expect(res.body.lastName).to.be.an('string')
          expect(res.body).not.to.have.own.property('accounts')
          done()
        })
    })

    it('should return target user data', done => {
      request(app.server)
        .get('/v1/users/1052ab85-08da-4bb5-be00-9e94d282d310')
        .set('X-API-KEY', 'superpowers')
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) throw new Error(err)

          const user = res.body
          const expected = blueprints.user.get('1052ab85-08da-4bb5-be00-9e94d282d310')

          expect(user.id).to.be.equal(expected.id)
          expect(user.firstName).to.be.equal(expected.firstName)
          expect(user.lastName).to.be.equal(expected.lastName)
          expect(user.createdAt).to.be.equal('2018-02-16T12:32:03.341Z')
          done()
        })
    })

    it('should return 404 if user does not exist', done => {
      request(app.server)
        .get('/v1/users/0052ab85-08da-4bb5-be00-9e94d282d399')
        .set('X-API-KEY', 'superpowers')
        .expect('Content-Type', /json/)
        .expect(404)
        .end(done)
    })
  })
})
