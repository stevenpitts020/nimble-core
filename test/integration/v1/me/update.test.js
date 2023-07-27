describe('PUT /me', () => {
  let token
  let user10

  function doRequestAndExpect(obj, code, fn) {
    request(app.server)
      .put('/v1/me')
      .send(obj)
      .set('Authorization', 'Bearer ' + token)
      .expect('Content-Type', /json/)
      .expect(code)
      .end(fn)
  }

  beforeEach(async() => {
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')

    token = await helpers.getAuthToken()
    user10 = blueprints.me.get('1052ab85-08da-4bb5-be00-9e94d282d310')
  })

  describe('validation', () => {
    it('should validate request schema', done => {
      const data = {
        email: 'updatedemail@nimblefi.com',
        createdAt: 'invalid field data',
        created_at: 'invalid field data'
      }
      doRequestAndExpect(data, 400, done)
    })

    it('should ignore fields not described in the schema', done => {
      const data = {
        new_field: 1,
        customField: 2,
        notafield: 2,

        email: 'anotheremail@nimblefi.com',
        firstName: 'another First Name',
        lastName: 'another Last Name'
      }

      doRequestAndExpect(data, 200, (err, res) => {
        if (err) throw new Error(err)

        const user = _.omit(res.body, 'institution.publicMetadata')
        const expectedUser = _.omit(_.merge(
          {},
          user10,
          _.omit(data, ['new_field', 'customField', 'notafield', 'birthDate', 'weight', 'level'])
        ), 'institution.publicMetadata')

        expect(user).to.deep.equal(expectedUser)

        expect(user).not.to.have.own.property('new_field')
        expect(user).not.to.have.own.property('newField')
        expect(user).not.to.have.own.property('customField')
        expect(user).not.to.have.own.property('custom_field')
        expect(user).not.to.have.own.property('notafield')

        done()
      })
    })

    it('should reject invalid fields', done => {
      const data = {
        email: 'updatedemail@nimblefi.com',
        createdAt: 'invalid field data',
        created_at: 'invalid field data'
      }
      doRequestAndExpect(data, 400, (err, res) => {
        if (err) throw new Error(err)

        expect(res.body.message).not.to.be.undefined
        expect(res.body.message).to.be.a('string')
        expect(res.body.message).to.contain('"createdAt" is not allowed')

        done()
      })
    })

    it('should reject invalid password', done => {
      const data = {
        password: null
      }
      doRequestAndExpect(data, 400, (err, res) => {
        if (err) throw new Error(err)

        expect(res.body.message).not.to.be.undefined
        expect(res.body.message).to.be.a('string')
        expect(res.body.message).to.contain('"password" must be a string')

        done()
      })
    })

    it('should reject short password', done => {
      const data = {
        password: 'asd' // short passwords are not allowed
      }
      doRequestAndExpect(data, 400, (err, res) => {
        if (err) throw new Error(err)

        expect(res.body.message).not.to.be.undefined
        expect(res.body.message).to.be.a('string')
        expect(res.body.message).to.contain('must be at least 6 characters long')

        done()
      })
    })

    it('should reject long password', done => {
      const data = {
        password: new Array(300).join('pwd') // very long passwords are not allowed
      }
      doRequestAndExpect(data, 400, (err, res) => {

        if (err) throw new Error(err)

        expect(res.body.message).not.to.be.undefined
        expect(res.body.message).to.be.a('string')
        expect(res.body.message).to.contain('must be less than or equal to 160 characters long')

        done()
      })
    })

    it('should complain about required fields', done => {
      const data = {
        // there are no required fields
      }
      doRequestAndExpect(data, 200, done)
    })

    it('should complain about duplicated email', async() => {
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d320')

      const data = {
        email: 'adminuser@nimblefi.com'
      }

      return request(app.server)
        .put('/v1/me')
        .send(data)
        .set('Authorization', 'Bearer ' + token)
        .expect(409)
    })

    it('should not complain about duplicated email if its same user', done => {
      const data = {
        email: 'demouser@nimblefi.com'
      }
      doRequestAndExpect(data, 200, done)
    })
  })

  it('should return 200', done => {
    let data = { email: 'demouser@nimblefi.com' }
    doRequestAndExpect(data, 200, done)
  })

  it('should return updated user data', done => {
    const data = {
      email: 'newemail@nimblefi.com',
      firstName: 'new First Name',
      lastName: 'new Last Name'
    }

    doRequestAndExpect(data, 200, (err, res) => {
      if (err) return done(err)

      const expectedUser = _.omit(_.merge({}, user10, data), 'institution.publicMetadata')

      expect(_.omit(res.body, 'institution.publicMetadata')).to.deep.equal(expectedUser)

      done()
    })
  })

  it('should update user with full fields', done => {
    const data = {
      email: 'anotheremail@nimblefi.com',
      firstName: 'another First Name',
      lastName: 'another Last Name'
    }

    doRequestAndExpect(data, 200, (err, res) => {
      if (err) return done(err)

      const expectedUser = _.omit(_.merge({}, user10, data), 'institution.publicMetadata')

      expect(_.omit(res.body, 'institution.publicMetadata')).to.deep.equal(expectedUser)

      done()
    })
  })

  it('should update user with partial fields', done => {
    const data = {
      firstName: 'another First Name',
      lastName: 'another Last Name'
    }

    doRequestAndExpect(data, 200, (err, res) => {
      if (err) return done(err)

      const expectedUser = _.omit(_.merge({}, user10, data), 'institution.publicMetadata')

      expect(_.omit(res.body, 'institution.publicMetadata')).to.deep.equal(expectedUser)

      done()
    })
  })

  it('should update user with only required fields', done => {
    const data = {
      // there are no required fields
    }

    doRequestAndExpect(data, 200, (err, res) => {
      if (err) return done(err)

      expect(_.omit(res.body, 'institution.publicMetadata')).to.be.deep.equal(_.omit(user10, 'institution.publicMetadata'))

      done()
    })
  })

  it('should update and ignore the id field', async() => {
    const userId = '1052ab85-08da-4bb5-be00-9e94d282d320'
    await seed.user.create(userId)
    await seed.account.create(userId)

    const data = {
      id: userId, // this is another id in the seed
      email: 'anotheremail@nimblefi.com',
      lastName: 'bar'
    }

    return request(app.server)
      .put('/v1/me')
      .send(data)
      .set('Authorization', 'Bearer ' + token)
      .expect((res) => {
        const user = _.omit(res.body, 'institution.publicMetadata')
        const expectedUser = _.omit(_.merge({}, user10, _.omit(data, ['id'])), 'institution.publicMetadata')

        expect(user).to.deep.equal(expectedUser)

        expect(user.id).to.be.equal('1052ab85-08da-4bb5-be00-9e94d282d310')
        expect(user.email).to.be.equal(data.email)
        expect(user.lastName).to.be.equal(data.lastName)

        //fetch user 20 and make sure it was unaltered
        return request(app.server)
          .get('/v1/users/1052ab85-08da-4bb5-be00-9e94d282d320')
          .set('X-API-KEY', 'superpowers')
          .expect((res) => {
            expect(res.statusCode).to.be.equal(200)

            const user = _.omit(res.body, 'institution.publicMetadata')
            const expectedUser = _.omit(_.merge({}, blueprints.user.get(userId)), 'institution.publicMetadata')

            expect(user).to.deep.equal(expectedUser)
            expect(user.email).not.to.be.equal(data.email)
          })
      })
  })

  describe('update Password', () => {
    beforeEach(async() => {
      await knex.raw(`UPDATE users set failed_login_attempts = 1 where id = '${user10.id}'`)
    })

    it('should return 200 on success', done => {
      const data = { password: 'newpassword1' }

      doRequestAndExpect(data, 200, (err, res) => {
        if (err) throw new Error(err)

        expect(_.omit(res.body, 'institution.publicMetadata')).to.be.deep.equal(_.omit(user10, 'institution.publicMetadata'))
        done()
      })
    })

    it('should reset failed login attempts on success', done => {
      const data = { password: 'newpassword1' }

      doRequestAndExpect(data, 200, async(err) => {
        if (err) throw new Error(err)

        const failedLoginAttempts = await knex.raw(`SELECT failed_login_attempts FROM users WHERE id = '${user10.id}'`)
        expect(failedLoginAttempts.rows[0].failed_login_attempts).to.equal(0)

        done()
      })
    })

    it('should allow user to login with new password', done => {
      const user = blueprints.auth.get('1052ab85-08da-4bb5-be00-9e94d282d310')
      const data = {
        password: 'newpassword2'
      }

      doRequestAndExpect(data, 200, (err) => {
        if (err) throw new Error(err)
        const auth = { email: user.email, password: data.password }
        request(app.server)
          .post('/v1/auth/login')
          .send(auth)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(done)
      })
    })

    it('should NOT allow user to login with old password', done => {
      const user = blueprints.auth.get('1052ab85-08da-4bb5-be00-9e94d282d310')
      const data = {
        password: 'newpassword3'
      }

      doRequestAndExpect(data, 200, (err) => {
        if (err) throw new Error(err)
        const auth = _.pick(user, ['email', 'password'])
        request(app.server)
          .post('/v1/auth/login')
          .send(auth)
          .expect('Content-Type', /json/)
          .expect(401)
          .end(done)
      })
    })
  })
})
