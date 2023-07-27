const _ = require('lodash')

describe('POST /account-requests/:id/bsa-risk-results', async () => {
  const pendingAccountRequestId = '17ba2033-1c12-463b-bbc7-72deed747ae7'
  let bsaRiskResults

  beforeEach(async () => {
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.document.create()
    await seed.accountRequest.create(pendingAccountRequestId)
    await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454723')

    bsaRiskResults = [
      {
        position: 0,
        questionId: 'are-all-account-owners',
        answer: 'Yes'
      },
      {
        position: 1,
        questionId: 'will-you-mantain',
        answer: null
      },
      {
        position: 3,
        questionId: 'name-bank',
        answer: 'Gotham City Bank'
      },
      {
        position: 4,
        questionId: 'usCitizen',
        answer: 'No'
      }
    ]
  })

  function getToken(signerId) {
    return app.services.token.get({
      scopes: ['account_requests'],
      resources: [`account_requests#${signerId}`],
      expiration: 10
    })
  }

  describe('with invalid auth', () => {
    it('should return 401 if no auth', async () => {
      return request(app.server)
        .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should return 401 if bad auth', async () => {
      return request(app.server)
        .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
        .set('Authorization', 'Bearer ' + "AAAA")
        .expect(401)
    })

    it('should complain if auth token is from the wrong account request', async () => {
      const token = getToken('00000000-0000-0000-0000-4bd8aa454722')

      return request(app.server)
        .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
        .set('Authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(403)
    })
  })

  describe('when validating', () => {
    describe('the schema', async () => {
      ['questionId', 'position']
        .map(field => {
          it(`should complain about missing field ${field}`, async () => {
            const badRecord = _.omit(bsaRiskResults[0], field)
            const payload = [badRecord]

            return request(app.server)
              .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
              .set('Authorization', 'Bearer ' + getToken(pendingAccountRequestId))
              .send(payload)
              .expect(400)
              .expect(res => {
                expect(res.body.message).to.contain(`.${field}" is required`)
              })
          })
          return field
        })
    })

    it('should complain about null schema', async () => {
      const token = getToken(pendingAccountRequestId)
      return request(app.server)
        .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
        .set('Authorization', 'Bearer ' + token)
        .send(null)
        .expect(400)
        .expect(res => {
          expect(res.body.message).to.contain('"value" must be an array')
        })
    })

    it('should complain about not an array schema', async () => {
      const token = getToken(pendingAccountRequestId)
      return request(app.server)
        .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
        .set('Authorization', 'Bearer ' + token)
        .send({})
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          expect(res.body.message).to.contain('"value" must be an array')
        })
    })

    it('should complain about empty array schema', async () => {
      const token = getToken(pendingAccountRequestId)
      return request(app.server)
        .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
        .set('Authorization', 'Bearer ' + token)
        .send([])
        .expect(400)
        .expect(res => {
          expect(res.body.message).to.contain('"value" must contain at least 1 items')
        })
    })

    it('should complain about empty response', async () => {
      const token = getToken(pendingAccountRequestId)
      return request(app.server)
        .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
        .set('Authorization', 'Bearer ' + token)
        .send([{
          position: 0,
          questionId: 'are-all-account-owners',
          answer: ''
        }])
        .expect(400)
        .expect(res => {
          expect(res.body.message).to.contain('"[0].answer" is not allowed to be empty')
        })
    })
  })

  it('should complain about invalid account request id', async () => {
    const token = getToken('2552ab85-aaaa-bbbb-cccc-9e94d282d311')
    return request(app.server)
      .post(`/v1/account-requests/2552ab85-aaaa-bbbb-cccc-9e94d282d311/bsa-risk-results`)
      .set('Authorization', 'Bearer ' + token)
      .send(bsaRiskResults)
      .expect(404)
  })

  it('should return 403 if invalid account request state is APPROVED', async () => {
    await knex('account_requests').update('status', 'APPROVED').where('id', pendingAccountRequestId)
    const token = getToken(pendingAccountRequestId)
    return request(app.server)
      .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
      .set('Authorization', 'Bearer ' + token)
      .send(bsaRiskResults)
      .expect(412)
      .expect((res) => {
        expect(res.body.message).to.contain(`can not be created for [${pendingAccountRequestId}] with status APPROVED`)
      })
  })

  it('should return 403 if invalid account request state is DECLINED', async () => {
    await knex('account_requests').update('status', 'DECLINED').where('id', pendingAccountRequestId)
    const token = getToken(pendingAccountRequestId)
    return request(app.server)
      .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
      .set('Authorization', 'Bearer ' + token)
      .send(bsaRiskResults)
      .expect(412)
      .expect((res) => {
        expect(res.body.message).to.contain(`can not be created for [${pendingAccountRequestId}] with status DECLINED`)
      })
  })

  it('should return 201', async () => {
    const token = getToken(pendingAccountRequestId)
    return request(app.server)
      .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
      .set('Authorization', 'Bearer ' + token)
      .send(bsaRiskResults)
      .expect(201)
  })

  it('should return the BSA Risk results', async () => {
    const token = getToken(pendingAccountRequestId)
    return request(app.server)
      .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
      .set('Authorization', 'Bearer ' + token)
      .send(bsaRiskResults)
      .expect(201)
      .expect((res) => {
        expect(res.body).to.deep.equal(blueprints.bsa_risk_results.bsa_risk_result_1)
      })
  })

  it('should persist the BSA answers in the database', async () => {
    const token = getToken(pendingAccountRequestId)
    return request(app.server)
      .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
      .set('Authorization', 'Bearer ' + token)
      .send(bsaRiskResults)
      .expect(201)
      .then(async () => {
        let data = await knex.raw('SELECT * FROM bsa_risk_results order by position')
        const answerA = data.rows.shift()
        const answerB = data.rows.shift()
        const answerC = data.rows.shift()

        expect(answerA.question_id).to.equal('are-all-account-owners')
        expect(answerA.answer).to.equal('Yes')
        expect(answerA.position).to.equal(0)

        expect(answerB.question_id).to.equal('will-you-mantain')
        expect(answerB.answer).to.equal(null)
        expect(answerB.position).to.equal(1)

        expect(answerC.question_id).to.equal('name-bank')
        expect(answerC.answer).to.equal('Gotham City Bank')
        expect(answerC.position).to.equal(3)
      })
  })

  it('should persist the BSA risk and score', async () => {
    const token = getToken(pendingAccountRequestId)
    return request(app.server)
      .post(`/v1/account-requests/${pendingAccountRequestId}/bsa-risk-results`)
      .set('Authorization', 'Bearer ' + token)
      .send(bsaRiskResults)
      .expect(201)
      .then(async () => {
        let data = await knex.raw(`SELECT * FROM account_requests LIMIT 1`)
        const row = data.rows.shift()

        expect(row.bsa_score).to.equal(2)
        expect(row.bsa_risk).to.equal('Low')
      })
  })
})
