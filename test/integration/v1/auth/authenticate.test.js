const sinon = require('sinon')

describe('Auth', () => {
  describe('Authentication', () => {
    describe('Beared: Token invalid', () => {
      it('should not allow un-authenticated requests', done => {
        request(app.server)
          .get('/v1/me')
          .expect('Content-Type', /json/)
          .expect(401)
          .end(done)
      })

      it('should not allow invalid tokens requests', done => {
        request(app.server)
          .get('/v1/me')
          .set('Authorization', 'Bearer ' + 'INVALID TOKEN')
          .expect('Content-Type', /json/)
          .expect(401)
          .end(done)
      })
    })

    describe('Beared: Token valid', () => {
      beforeEach(async () => {
        await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
        await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      })

      it('should respond to valid auth with 200', done => {
        request(app.server)
          .post('/v1/auth/login')
          .send({ email: 'demouser@nimblefi.com', password: 'pwd' })
          .expect('Content-Type', /json/)
          .expect(200)
          .end(done)
      })

      it('should return a token on valid auth', done => {
        request(app.server)
          .post('/v1/auth/login')
          .send({ email: 'demouser@nimblefi.com', password: 'pwd' })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body.token).not.be.undefined
            done()
          })
      })

      describe('with email domain case insensitive', () => {
        it('should respond to valid auth with 200', done => {
          request(app.server)
            .post('/v1/auth/login')
            .send({ email: 'demouser@nimblefi.com', password: 'pwd' })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done)
        })

        it('should return a token on valid auth', done => {
          request(app.server)
            .post('/v1/auth/login')
            .send({ email: 'demouser@nimblefi.com', password: 'pwd' })
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) throw new Error(err)

              expect(res.body.token).not.be.undefined
              done()
            })
        })
      })

      it('should allow valid tokens to access private methods', done => {
        request(app.server)
          .post('/v1/auth/login')
          .send({ email: 'demouser@nimblefi.com', password: 'pwd' })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            request(app.server)
              .get('/v1/me')
              .set('Authorization', 'Bearer ' + res.body.token)
              .expect('Content-Type', /json/)
              .expect(200)
              .end((err, res) => {
                expect(res.body.id).to.be.an('string')
                expect(res.body.email).to.be.an('string')
                expect(res.body.email).to.be.equal('demouser@nimblefi.com')
                expect(res.body.accounts).to.be.an('array')
                expect(res.body.accounts).to.have.have.lengthOf(1)
                done()
              })
          })
      })
    })

    describe('POST /auth/login', () => {
      beforeEach(async () => {
        await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
        await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      })

      it('show accept valid login and return token', done => {
        request(app.server)
          .post('/v1/auth/login')
          .send({ email: 'demouser@nimblefi.com', password: 'pwd' })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body.token).not.be.undefined
            done()
          })
      })

      it('show reject invalid user:pass', done => {
        request(app.server)
          .post('/v1/auth/login')
          .send({ email: 'notemail@nimblefi.com', password: 'notpass' })
          .expect('Content-Type', /json/)
          .expect(401)
          .end(done)
      })

      it('show reject invalid misisng params', done => {
        request(app.server)
          .post('/v1/auth/login')
          .send({ uname: 'notusername', pword: 'notpass', foo: 'bar' })
          .expect('Content-Type', /json/)
          .expect(400)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body.message).to.not.be.undefined
            expect(res.body.message).to.contain('"email" is required')
            expect(res.body.message).to.contain('"password" is required')
            expect(res.body.message).to.contain('"uname" is not allowed')
            expect(res.body.message).to.contain('"uname" is not allowed')
            expect(res.body.message).to.contain('"foo" is not allowed')

            done()
          })
      })

      describe('when user fails to login', () => {
        beforeEach(async () => {
          await knex.raw(`UPDATE users set failed_login_attempts = 1 where id = '1052ab85-08da-4bb5-be00-9e94d282d310'`)
        })

        it('show increment failed login attempts', async () => {
          return request(app.server)
            .post('/v1/auth/login')
            .send({ email: 'demouser@nimblefi.com', password: 'notpass' })
            .expect('Content-Type', /json/)
            .expect(401)
            .expect(async() => {
              const failedLoginAttempts = await knex.raw(`SELECT failed_login_attempts FROM users WHERE id = '1052ab85-08da-4bb5-be00-9e94d282d310'`)
              expect(failedLoginAttempts.rows[0].failed_login_attempts).to.equal(2)
            })
        })

        it('show reset failed login attempts with login has valid credentials', async () => {
          return request(app.server)
            .post('/v1/auth/login')
            .send({ email: 'demouser@nimblefi.com', password: 'pwd' })
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(async() => {
              const failedLoginAttempts = await knex.raw(`SELECT failed_login_attempts FROM users WHERE id = '1052ab85-08da-4bb5-be00-9e94d282d310'`)
              expect(failedLoginAttempts.rows[0].failed_login_attempts).to.equal(0)
            })
        })

        describe('when MAX_FAILED_LOGIN_ATTEMPTS is reached', () => {
          let emailSpy

          beforeEach(async () => {
            emailSpy = sinon.spy(app.services.email, 'userLocked')

            await knex.raw(`UPDATE users set failed_login_attempts = 3 where id = '1052ab85-08da-4bb5-be00-9e94d282d310'`)
          })

          afterEach(()=> sinon.restore())

          it('should not allow login', done => {
            request(app.server)
              .post('/v1/auth/login')
              .send({ email: 'demouser@nimblefi.com', password: 'pwd' })
              .expect('Content-Type', /json/)
              .expect(401)
              .end(done)
          })

          it('show send email locked email when it reaches max failed login attempts', async () => {
            await knex.raw(`UPDATE users set failed_login_attempts = 2 where id = '1052ab85-08da-4bb5-be00-9e94d282d310'`)

            return request(app.server)
              .post('/v1/auth/login')
              .send({ email: 'demouser@nimblefi.com', password: 'wrongpass' })
              .expect('Content-Type', /json/)
              .expect(401)
              .expect(() => {
                expect(emailSpy).to.have.been.calledOnce
                expect(emailSpy).to.have.been.calledWith('1052ab85-08da-4bb5-be00-9e94d282d310')
              })
          })
        })
      })
    })
  })
})
