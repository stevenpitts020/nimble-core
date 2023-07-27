const sinon = require('sinon')

describe('POST /users', () => {
  let user

  describe('with invalid auth', () => {
    it('should reject with 401 without apikey', done => {
      request(app.server)
        .post('/v1/users')
        .send(user)
        .expect('Content-Type', /json/)
        .expect(401)
        .end(done)
    })
  })

  describe('when validating', () => {
    it('should reject with 400 if validation fails', done => {
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send({uname: 'testUser', foo: 'bar'})
        .expect('Content-Type', /json/)
        .expect(400)
        .end(done)
    })

    it('should show reasons for failed validations', done => {
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send({uname: 'testUser', foo: 'bar'})
        .end((err, res) => {
          if (err) throw new Error(err)

          expect(res.body.message).to.not.be.undefined
          expect(res.body.message).to.contain('"email" is required')
          expect(res.body.message).to.contain('"institutionId" is required')
          expect(res.body.message).to.contain('"firstName" is required')
          expect(res.body.message).to.contain('"lastName" is required')
          done()
        })
    })
  })

  describe('with invalid data', () => {
    beforeEach(async () => {
      const userId = '1052ab85-08da-4bb5-be00-9e94d282d310'
      user = _.omit(blueprints.user.get(userId), 'id', 'createdAt')
    })

    it('should return 404 when institutionId not valid', done => {
      const institutionId = '2552ab85-08da-4bb5-be00-9e94d282d319'
      const branchId = '2552ab85-08da-4bb5-be00-9e94d282d319'
      user.institutionId = institutionId
      user.branchId = branchId
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send(user)
        .expect(404)
        .end(done)
    })

    it('should return 404 when branchId not valid', done => {
      const institutionId = '2552ab85-08da-4bb5-be00-9e94d282d319'
      const branchId = '2552ab85-08da-4bb5-be00-9e94d282d319'
      user.institutionId = institutionId
      user.branchId = branchId
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send(user)
        .expect(404)
        .end(done)
    })

    it('should return 400 when email is not valid', done => {
      user.email = 'testUser'
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send(user)
        .expect(400)
        .end(done)
    })

    it('should show fail registration when email not valid', done => {
      user.email = 'testUser'
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send(user)
        .expect(res => expect(res.body.message).to.contain('must be a valid email'))
        .end(done)
    })
  })

  describe('with valid data', () => {
    beforeEach(async () => {
      const userId = '1052ab85-08da-4bb5-be00-9e94d282d310'
      const institutionId = '2552ab85-08da-4bb5-be00-9e94d282d311'
      const branchId = '2552ab85-0000-0000-0000-000000000001'
      user = _.omit(blueprints.user.get(userId), 'id', 'createdAt')
      user.institutionId = institutionId
      user.branchId = branchId
      await seed.institution.create(institutionId)
      await seed.institutionBranch.create(branchId)
    })

    it('should create user account', done => {
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send(user)
        .expect('Content-Type', /json/)
        .expect(201)
        .end(done)
    })

    it('should persist institution id on user information', done => {
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send(user)
        .expect('Content-Type', /json/)
        .expect(201)
        .end(err => {
          if (err) throw new Error(err)

          // check if institutionCode was persisted
          knex('users')
            .where('email', user.email)
            .first()
            .then(row => {
              expect(row.institution_id).to.equal(user.institutionId)
              done()
            })
        })
    })

    it('should persist institution branch id on user information', done => {
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send(user)
        .expect('Content-Type', /json/)
        .expect(201)
        .end(err => {
          if (err) throw new Error(err)

          // check if institutionCode was persisted
          knex('users')
            .where('email', user.email)
            .first()
            .then(row => {
              expect(row.branch_id).to.equal(user.branchId)
              done()
            })
        })
    })

    it('should persist email with domain insensitive', done => {
      user.email = 'testUser@nimblefi.com'
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send(user)
        .expect('Content-Type', /json/)
        .expect(201)
        .end(err => {
          if (err) throw new Error(err)

          knex('users')
            .where('email', 'testUser@nimblefi.com')
            .first()
            .then(row => {
              expect(row).to.exist
              done()
            })
        })
    })

    it('should return newly created user account', done => {
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send(user)
        .expect('Content-Type', /json/)
        .expect(201)
        .end((err, res) => {
          if (err) throw new Error(err)

          expect(res.body.id).to.be.an('string')
          expect(res.body.firstName).to.be.an('string')
          expect(res.body.lastName).to.be.an('string')
          expect(res.body.email).to.be.equal(user.email)
          done()
        })
    })

    describe('when user exists', () => {
      beforeEach(async () => {
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      })

      it('should reject with 409', () => {
        return request(app.server)
          .post('/v1/users')
          .set('X-API-KEY', 'superpowers')
          .send(user)
          .expect('Content-Type', /json/)
          .expect(409)
      })

      it('should reject with 409 with domain case insensitive', () => {
        user.email = 'demouser@NIMBLEFI.com'
        return request(app.server)
          .post('/v1/users')
          .set('X-API-KEY', 'superpowers')
          .send(user)
          .expect('Content-Type', /json/)
          .expect(409)
      })

      it('should have a message in case of 409', () => {
        return request(app.server)
          .post('/v1/users')
          .set('X-API-KEY', 'superpowers')
          .send(user)
          .expect(res => {
            expect(res.body.message).to.not.be.undefined
            expect(res.body.message).to.contain('already exists')
          })
      })
    })
  })

  describe('async jobs', ()=>{
    let emailSpy = null
    beforeEach(async () => {
      const userId = '1052ab85-08da-4bb5-be00-9e94d282d310'
      const institutionId = '2552ab85-08da-4bb5-be00-9e94d282d311'
      const branchId = '2552ab85-0000-0000-0000-000000000001'
      user = _.omit(blueprints.user.get(userId), 'id', 'createdAt')
      user.institutionId = institutionId
      user.branchId = branchId
      emailSpy = sinon.spy(app.services.email, 'welcome')
      await seed.institution.create(institutionId)
      await seed.institutionBranch.create(branchId)
    })

    afterEach(()=> sinon.restore())

    it('should fire a welcome email', done => {
      request(app.server)
        .post('/v1/users')
        .set('X-API-KEY', 'superpowers')
        .send(user)
        .expect('Content-Type', /json/)
        .expect(201)
        .end((err, res) => {
          if (err) throw new Error(err)

          expect(emailSpy).to.have.been.calledOnce
          expect(emailSpy).to.have.been.calledWith(res.body.id)
          // we have to wait a bit for async stuff before finishing the test or else de database clears
          setTimeout(done, 10)
        })
    })
  })
})
