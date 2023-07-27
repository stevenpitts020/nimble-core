
const uuid = require('uuid')

describe('GET /account-requests/:id/bsa-risk-results', async () => {
  let clock, token

  before(async () => {
    clock = sinon.useFakeTimers({
      toFake: ['Date']
    })
  })

  after(() => {
    clock.restore()
  })

  beforeEach(async () => {
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.document.create()
    await seed.accountRequest.create('2552ab85-08da-4bb5-be00-9e94d282d348')
    await seed.signer.create('2552ab85-08da-4bb5-be00-9e94d282d348')
    await seed.bsaRiskResult.create()
    token = await helpers.getAuthToken()
  })


  describe('with invalid auth', () => {
    it('should return 401 if no auth', async () => {
      return request(app.server)
        .get('/v1/account-requests/2552ab85-08da-4bb5-be00-9e94d282d348/bsa-risk-results')
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should return 404 auth user does not belong to institution', async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000020')
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d350')
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d350')
      const badToken = await helpers.getAuthToken('1052ab85-08da-4bb5-be00-9e94d282d350')

      return request(app.server)
        .get(`/v1/account-requests/2552ab85-08da-4bb5-be00-9e94d282d348/bsa-risk-results`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + badToken)
        .expect(404)
    })

    it('should return 401 if bad auth', async () => {
      return request(app.server)
        .get('/v1/account-requests/2552ab85-08da-4bb5-be00-9e94d282d348/bsa-risk-results')
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + "AAAA")
        .expect(401)
    })
  })

  describe('with invalid data', () => {

    it('should return 400 with invalid uuid as id', async () => {
      const id = 'invalid-uuid-here'
      return request(app.server)
        .get(`/v1/account-requests/${id}/bsa-risk-results`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(400)
    })

    it('should return 404 with random uuid', async () => {
      const id = uuid.v4()
      return request(app.server)
        .get(`/v1/account-requests/${id}/bsa-risk-results`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(404)
    })

  })

  it('should return 200 with valid uuid', async () => {
    return request(app.server)
      .get(`/v1/account-requests/2552ab85-08da-4bb5-be00-9e94d282d348/bsa-risk-results`)
      .expect('Content-Type', /json/)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
  })


  describe("BSA Risk Results", async () => {

    it('should return a list of results', async () => {
      return request(app.server)
        .get(`/v1/account-requests/2552ab85-08da-4bb5-be00-9e94d282d348/bsa-risk-results`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect(res => {
          expect(res.body).to.an('Array')
          expect(res.body).to.have.lengthOf(3)
        })
    })

    it('should return a list with the expected schema', async () => {
      return request(app.server)
        .get(`/v1/account-requests/2552ab85-08da-4bb5-be00-9e94d282d348/bsa-risk-results`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect(res => {

          expect(res.body).to.an('Array')
          expect(res.body).to.have.lengthOf(3)

          const first = res.body[0]

          expect(first).to.have.ownProperty('position')
          expect(first).to.have.ownProperty('questionId')
          expect(first).to.have.ownProperty('answer')
        })
    })

    it('should return a list of ordered results', async () => {
      return request(app.server)
        .get(`/v1/account-requests/2552ab85-08da-4bb5-be00-9e94d282d348/bsa-risk-results`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect(res => {

          expect(res.body).to.an('Array')
          expect(res.body).to.have.lengthOf(3)

          const first = res.body[0]
          expect(first.position).to.equal(0)

          const second = res.body[1]
          expect(second.position).to.equal(1)

          const third = res.body[2]
          expect(third.position).to.equal(2)
        })
    })

    describe('and sorting', () => {
      function doSortAndExpect(query, expectedArr, done) {
        request(app.server)
          .get(`/v1/account-requests/2552ab85-08da-4bb5-be00-9e94d282d348/bsa-risk-results?` + query)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            res.body.forEach((item, index) => {
              expect(item.position).to.equal(expectedArr[index])
            })
            done()
          })
      }

      it('should 400 on invalid sort parameter', done => {
        request(app.server)
          .get(`/v1/account-requests/2552ab85-08da-4bb5-be00-9e94d282d348/bsa-risk-results?sort=unexistent`)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(400)
          .end(err => {
            if (err) throw new Error(err)
            done()
          })
      })

      it('should sort by position ASC by default', done => {
        const expected = [
          0,
          1,
          2,
        ]

        doSortAndExpect('', expected, done)
      })

      it('should sort by position DESC', done => {
        const expected = [
          2,
          1,
          0,
        ]
        doSortAndExpect('sort=-position', expected, done)
      })

    })

  })
})
