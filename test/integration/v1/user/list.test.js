describe('GET /users', () => {
  describe('with invalid auth', () => {
    it('should return 401 if not authenticated', done => {
      request(app.server)
        .get('/v1/users')
        .expect('Content-Type', /json/)
        .expect(401)
        .end(done)
    })
  })

  describe('with valid auth', () => {
    let token
    const user10Id = '1052ab85-08da-4bb5-be00-9e94d282d310'

    beforeEach(async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
      await seed.user.create(user10Id)
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      token = await helpers.getAuthToken()
    })

    it('should return 401 if authenticated bearer token', done => {
      request(app.server)
        .get('/v1/users')
        .set('Authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(401)
        .end(done)
    })

    it('should return 200', done => {
      request(app.server)
        .get('/v1/users?limit=1')
        .set('X-API-KEY', 'superpowers')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(done)
    })

    it('should return valid user object', done => {
      request(app.server)
        .get('/v1/users?limit=1')
        .set('X-API-KEY', 'superpowers')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) throw new Error(err)

          const props = ['id', 'firstName', 'lastName', 'createdAt']

          expect(res.body).to.have.lengthOf(1)
          const user = res.body[0]

          props.forEach(prop => {
            expect(user).to.have.own.property(prop)
          })

          expect(user).not.to.have.own.property('updatedAt')

          expect(user.id).to.be.an('string')
          expect(res.body).not.to.have.own.property('email')
          expect(user.firstName).to.be.an('string')
          expect(user.lastName).to.be.an('string')
          expect(user).not.to.have.own.property('accounts')
          done()
        })
    })

    describe('with multiple data', () => {
      const user20Id = '1052ab85-08da-4bb5-be00-9e94d282d320'

      beforeEach(async () => {
        await seed.user.create(user20Id)
      })

      it('should return a list of users', done => {
        request(app.server)
          .get(`/v1/users?limit=1`)
          .set('X-API-KEY', 'superpowers')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(1)
            //expect(res.body[0]).to.deep.equal(blueprints.user.get(user10Id))
            done()
          })
      })

      it('should ignore parameters outside of limit offset', done => {
        request(app.server)
          .get(`/v1/users?page=2&limit=1`)
          .set('X-API-KEY', 'superpowers')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(1)
            done()
          })
      })

      it('should 400 on invalid sort parameter', done => {
        request(app.server)
          .get(`/v1/users?limit=1&sort=unexistent`)
          .set('X-API-KEY', 'superpowers')
          .expect('Content-Type', /json/)
          .expect(400)
          .end((err) => {
            if (err) throw new Error(err)
            done()
          })
      })

      it('should limit acording to :limit', done => {
        request(app.server)
          .get(`/v1/users?limit=1`)
          .set('X-API-KEY', 'superpowers')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(1)
            done()
          })
      })

      it('should offset acording to :offset', done => {
        request(app.server)
          .get(`/v1/users?limit=1&offset=1`)
          .set('X-API-KEY', 'superpowers')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].id).to.equal(blueprints.user.get(user20Id).id)
            done()
          })
      })

      describe('with paging defaults', () => {
        beforeEach(async () => {
          await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
          await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000020')
          await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d330')
          await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d340')
          await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d350')
        })

        it('should default limit if not set', done => {
          request(app.server)
            .get(`/v1/users?offset=0`)
            .set('X-API-KEY', 'superpowers')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) throw new Error(err)

              expect(res.body).to.be.an('array')
              expect(res.body).to.have.lengthOf(5)
              done()
            })
        })

        it('should default offset if not set', done => {
          request(app.server)
            .get(`/v1/users?limit=1`)
            .set('X-API-KEY', 'superpowers')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) throw new Error(err)

              expect(res.body).to.be.an('array')
              expect(res.body).to.have.lengthOf(1)
              expect(res.body[0].id).to.equal(blueprints.user.get(user10Id).id)
              done()
            })
        })
      })
    })
  })
})
