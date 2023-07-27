function postAndExpect(payload, code, fn) {
  request(app.server)
    .put(`/v1/auth/recover/${payload.email}`)
    .send(payload)
    .expect(code)
    .end(err => {
      if (err) throw new Error(err)
      fn()
    })
}

function doRequestAndExpectMessageToContain(payload, code, error, fn) {
  request(app.server)
    .put(`/v1/auth/recover/${payload.email}`)
    .send(payload)
    .expect('Content-Type', /json/)
    .expect(code)
    .end((err, res) => {
      if (err) throw new Error(err)
      expect(res.body.message).to.contain(error)
      fn()
    })
}

describe('Auth', () => {
  let user10

  beforeEach(async () => {
    user10 = blueprints.auth.get('1052ab85-08da-4bb5-be00-9e94d282d310')

    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.accountRecovery.create('1052ab85-08da-4bb5-be00-9e94d282d310')
  })

  describe('POST /auth/recover', () => {
    describe('validation', () => {
      it('should complain about invalid email', done => {
        let payload = { email: 'a', code: 'XPT099', password: 'newpass' }
        doRequestAndExpectMessageToContain(payload, 400, '"email" must be a valid email', done)
      })

      it('should complain about missing code', done => {
        let payload = { email: user10.email, password: 'safePassword123' }
        doRequestAndExpectMessageToContain(payload, 400, '"code" is required', done)
      })

      it('should complain about invalid code', done => {
        let payload = { email: user10.email, code: 123, password: 'safePassword123' }
        doRequestAndExpectMessageToContain(payload, 400, '"code" must be a string', done)
      })

      it('should complain about missing password', done => {
        let payload = { email: user10.email, code: 'CODE' }
        doRequestAndExpectMessageToContain(payload, 400, '"password" is required', done)
      })

      it('should complain about invalid password', done => {
        let payload = { email: user10.email, code: 'CODE', password: '' }
        doRequestAndExpectMessageToContain(payload, 400, '"password" is not allowed to be empty', done)
      })

      it('should complain about short password', done => {
        let payload = { email: user10.email, code: 'CODE', password: 'asd' }
        doRequestAndExpectMessageToContain(payload, 400, 'must be at least 6 characters long', done)
      })

      it('should complain about long password', done => {
        let payload = { email: user10.email, code: 'CODE', password: new Array(300).join("pwd") }
        doRequestAndExpectMessageToContain(payload, 400, 'must be less than or equal to 160 characters long', done)
      })

      it('should complain about code not found if expired', done => {
        let payload = { email: user10.email, code: 'INVALID', password: 'safePassword123' }
        doRequestAndExpectMessageToContain(payload, 404, 'please request a new code', done)
      })

      it('should complain about code not found if consumed', done => {
        let payload = { email: user10.email, code: 'CONSUMED', password: 'safePassword123' } // seed id 2
        doRequestAndExpectMessageToContain(payload, 404, 'please request a new code.', done)
      })

      it('should complain about code not found if expired', done => {
        let payload = { email: user10.email, code: 'EXPIRED', password: 'safePassword123' }  // seed id 3
        doRequestAndExpectMessageToContain(payload, 404, 'please request a new code.', done)
      })

      it('should complain about email not matching the code owner', async () => {
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d320')

        const user20 = blueprints.auth.get('1052ab85-08da-4bb5-be00-9e94d282d320')
        let payload = {
          email: user20.email,
          code: 'XPT099',
          password: 'newpass'
        }

        return request(app.server)
          .put(`/v1/auth/recover/${payload.email}`)
          .send(payload)
          .expect(404)
          .expect((res) => {
            expect(res.body.message).to.contain('please request a new code.')
          })
      })

      it('should complain about email not matching any user', done => {
        let payload = {
          email: 'unknown@user.com',
          code: 'XPT099',
          password: 'newpass'
        }
        doRequestAndExpectMessageToContain(payload, 404, 'please request a new code.', done)
      })
    })

    it('should reply with 204', done => {
      let payload = { email: user10.email, code: 'XPT099', password: 'newpass' }  // seed id 1
      postAndExpect(payload, 204, done)
    })

    it('should allow the user to login using the new password', done => {
      let payload = { email: user10.email, code: 'XPT099', password: 'newpass' }  // seed id 1
      postAndExpect(payload, 204, () => {
        request(app.server)
          .post(`/v1/auth/login`)
          .send({
            email: user10.email,
            password: payload.password
          })
          .expect(200)
          .end(done)
      })
    })

    it('should NOT allow the user to login using the old password', done => {
      let payload = { email: user10.email, code: 'XPT099', password: 'newpass' }  // seed id 1
      postAndExpect(payload, 204, () => {
        request(app.server)
          .post(`/v1/auth/login`)
          .send({
            email: user10.email,
            password: user10.password
          })
          .expect(401)
          .end(done)
      })
    })
  })
})
