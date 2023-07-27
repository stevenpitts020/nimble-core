function postAndExpect(email, code, fn) {
  request(app.server)
    .post(`/v1/auth/recover/${email}`)
    .expect(code)
    .end(err => {
      if (err) throw new Error(err)
      fn()
    })
}

function doRequestAndExpectMessageToContain(email, code, error, fn) {
  request(app.server)
    .post(`/v1/auth/recover/${email}`)
    .expect('Content-Type', /json/)
    .expect(code)
    .end((err, res) => {
      if (err) throw new Error(err)
      expect(res.body.message).to.contain(error)
      fn()
    })
}

describe('Auth', () => {
  describe('POST /auth/recover/:email', () => {
    describe('validation', () => {
      it('should complain about missing email', done => {
        doRequestAndExpectMessageToContain(null, 400, '"email" must be a valid email', done)
      })

      it('should complain about invalid email', done => {
        doRequestAndExpectMessageToContain('aaa', 400, '"email" must be a valid email', done)
      })

      it('should complain about user not found', done => {
        doRequestAndExpectMessageToContain('notfound@nimblefi.com', 404, 'Could not find an user with that email.', done)
      })

      it('should complain about account not found', async () => {
        await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
        await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d340')

        return request(app.server)
          .post('/v1/auth/recover/userwithoutactions@nimblefi.com')
          .expect('Content-Type', /json/)
          .expect(404)
          .expect((res) => {
            expect(res.body.message).to.contain('Could not find an user account with that email.')
          })
      })
    })

    describe('validation', () => {
      let user10

      beforeEach(async () => {
        user10 = blueprints.me.get('1052ab85-08da-4bb5-be00-9e94d282d310')

        await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
        await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.accountRecovery.create()
      })

      it('should reply with 204', done => {
        postAndExpect(user10.email, 204, done)
      })

      it('should save record on `AcountRecovery`', done => {
        const accountId = '0052ab85-08da-4bb5-be00-9e94d282d310'
        postAndExpect(user10.email, 204, () => {
          knex // check db for recovery codes
            .select()
            .from('account_recoveries')
            .where('account_id', accountId)
            .orderBy('created_at', 'desc')
            .first()
            .then(result => {
              expect(result).to.have.ownProperty('id')
              expect(result).to.have.ownProperty('code')
              expect(result).to.have.ownProperty('account_id')
              expect(result).to.have.ownProperty('expires_at')
              expect(result).to.have.ownProperty('consumed_at')

              expect(result.id).to.be.an('string')
              expect(result.account_id).to.equal(accountId)
              expect(result.code).to.be.an('string')
              expect(result.code).to.have.lengthOf(6)
              expect(result.consumed_at).to.equal(null)

              const expire_at = moment(result.expires_at)._d
              const expected_expire_at = moment().add(12, 'hours')._d
              expect(expire_at).to.be.above(expected_expire_at)

              done()
            })
        })
      })
    })
  })
})
