describe('GET /account-requests/count', () => {
  describe('with invalid auth', () => {
    it('should return 401 if no auth', () => {
      return request(app.server)
        .get('/v1/account-requests/count')
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should return 401 if bad auth', () => {
      return request(app.server)
        .get('/v1/account-requests/count')
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + "AAAA")
        .expect(401)
    })
  })

  describe('with valid auth', () => {
    let token

    beforeEach(async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d350')
      await seed.document.create()
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.accountRequest.create()

      token = await helpers.getAuthToken()
    })

    it('should return 200', done => {
      request(app.server)
        .get('/v1/account-requests/count')
        .set('Authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(done)
    })

    it('should return valid count object', done => {
      request(app.server)
        .get('/v1/account-requests/count')
        .set('Authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) throw new Error(err)

          const expected = res.body
          expect(expected).to.be.an('object')
          expect(expected).to.have.own.property('count')
          expect(expected.count).to.be.an('number')
          done()
        })
    })

    it('should return a count of account requests', done => {
      request(app.server)
        .get(`/v1/account-requests/count`)
        .set('Authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) throw new Error(err)

          const expected = res.body
          expect(expected).to.be.an('object')
          expect(expected).to.deep.equal({ count: 4 })
          done()
        })
    })

    describe('when filtered by status', () => {
      it('should return a filtered count', () => {
        return request(app.server)
          .get('/v1/account-requests/count?status=APPROVED')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect((res) => {
            const expected = res.body
            expect(expected).to.be.an('object')
            expect(expected).to.deep.equal({ count: 2 })
          })
      })

      it('should 400 on invalid status parameter', () => {
        return request(app.server)
          .get(`/v1/account-requests/count?status=unexistent`)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(400)
      })
    })
  })
})
