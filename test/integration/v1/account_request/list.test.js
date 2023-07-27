describe('GET /account-requests', () => {
  describe('with invalid auth', () => {
    it('should return 401 if no auth', done => {
      request(app.server).get('/v1/account-requests').expect('Content-Type', /json/).expect(401).end(done)
    })

    it('should return 401 if bad auth', done => {
      request(app.server)
        .get('/v1/account-requests')
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + 'AAAA')
        .expect(401)
        .end(done)
    })
  })

  describe('with valid auth', () => {
    const accountRequestId = '2552ab85-08da-4bb5-be00-9e94d282d348'
    let token, clock

    before(() => {
      clock = sinon.useFakeTimers({ toFake: ['Date'] })
    })

    after(() => {
      clock.restore()
    })

    describe('when not filtering', () => {
      beforeEach(async () => {
        await seed.institution.create() // required by seed.account_request_products
        await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
        await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d310')
        await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d340') // required by seed.account_request_products
        await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d310')
        await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d311')
        await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d312')
        await seed.productOption.create('7b9c52a2-c542-4031-8342-5fa29a2f6d0d')
        await seed.productOption.create('7b9c52a2-c542-4031-8342-5fa29a2f6d0e')
        await seed.productOption.create('7b9c52a2-c542-4031-8342-5fa29a2f6d0f')
        await seed.productOption.create('9a8a47ee-6880-4b5d-aa44-0b07b608783f')
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.document.create()
        await seed.accountRequest.create(accountRequestId)
        await seed.accountRequest.create('17ba2033-1c12-463b-bbc7-72deed747ae7')
        await seed.account_request_products() // insert all
        await seed.account_request_product_options() // insert all
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454721')

        token = await helpers.getAuthToken()
      })

      it('should return 200', done => {
        request(app.server)
          .get('/v1/account-requests')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(done)
      })

      it('should return valid account request object', () => {
        return request(app.server)
          .get('/v1/account-requests?limit=1')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const props = ['id', 'status', 'signers', 'createdAt', 'productConfigurations']

            expect(res.body).to.have.lengthOf(1)
            const first = res.body[0]

            // prop check
            props.forEach(prop => expect(first).to.have.own.property(prop))

            // type check
            expect(first.id).to.be.an('string')
            expect(first.status).to.be.an('string')
            expect(first.signers).to.be.an('array')
            expect(first.createdAt).to.be.an('string')
          })
      })

      it('should return valid productConfiguration.product', () => {
        return request(app.server)
          .get('/v1/account-requests?limit=1')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body[0].productConfigurations).to.be.an('array')

            const [product] = res.body[0].productConfigurations
            const expectedProduct = _.omit(blueprints.product.get('3552ab85-08da-4bb5-be00-9e94d282d310'), 'options')
            expect(product.productId).to.be.an('string')
            expect(product.createdAt).to.be.an('string')
            expect(product.product).to.be.an('object')
            expect(_.omit(product.product, 'options')).to.deep.equal(expectedProduct)
          })
      })

      it('should return valid productConfiguration.product.options', () => {
        return request(app.server)
          .get('/v1/account-requests?limit=1')
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body[0].productConfigurations).to.be.an('array')
            const [product] = res.body[0].productConfigurations
            const expectedOptions = [
              {
                "id": null,
                "category": "account_number",
                "key": "account_number",
                "title": "Account Number",
                "value": "001",
                "lead": null,
                "annotation": null,
                "parentId": null
              },
              {
                "id": "7b9c52a2-c542-4031-8342-5fa29a2f6d0e",
                "category": "another-choice",
                "key": "optionB",
                "title": "Option B",
                "value": "B",
                "lead": "Option B lead",
                "annotation": "Option B annotation",
                "parentId": "3552ab85-0000-0000-0000-9e94d282d312"
              },
              {
                "id": null,
                "category": "some-choice",
                "key": "optionA",
                "title": "Option A",
                "value": "A",
                "lead": null,
                "annotation": null,
                "parentId": null
              }
            ]
            expect(product.product.options).to.be.an('array')
            expect(product.product.options).to.deep.equal(expectedOptions)
          })
      })

      it('should return a list of account request', done => {
        request(app.server)
          .get(`/v1/account-requests?limit=1`)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) throw new Error(err)

            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0]).to.deep.equal(blueprints.accountRequest.get(accountRequestId))
            done()
          })
      })
    })

    describe('when filtering', () => {
      beforeEach(async () => {
        await seed.institution.create() // required by seed.account_request_products
        await seed.institutionBranch.create()
        await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d310')
        await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d340') // required by seed.account_request_products
        await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d310')
        await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d311')
        await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d312')
        await seed.productOption.create('7b9c52a2-c542-4031-8342-5fa29a2f6d0d')
        await seed.productOption.create('7b9c52a2-c542-4031-8342-5fa29a2f6d0e')
        await seed.productOption.create('7b9c52a2-c542-4031-8342-5fa29a2f6d0f')
        await seed.productOption.create('9a8a47ee-6880-4b5d-aa44-0b07b608783f')
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d350')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.document.create()
        await seed.accountRequest.create()
        await seed.account_request_products() // insert all
        await seed.account_request_product_options() // insert all
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454721')
        await seed.signer.create('00000000-0000-ACCC-0000-00BBBBBBB111')
        await seed.signer.create('00000000-0000-ACCC-0000-00BBBBBBB222')
        await seed.signer.create('ffffffff-0000-473e-a5cb-1ea08a01e701')
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454701')
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454702')
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454703')


        // force institution on seed
        await knex.raw(`UPDATE account_requests set institution_id = '2552ab85-08da-4bb5-be00-9e94d282d311'`)

        token = await helpers.getAuthToken()
      })

      describe('by status', () => {
        it('should return a filtered list', () => {
          return request(app.server)
            .get(`/v1/account-requests?status=APPROVED`)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(res => {
              expect(res.body).to.be.an('array')
              expect(res.body).to.have.lengthOf(4)
            })
        })

        it('should 400 on invalid status parameter', () => {
          return request(app.server)
            .get(`/v1/account-requests?status=unexistent`)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(400)
        })
      })

      describe('by limit and offset', () => {
        const accountRequestId2 = '17ba2033-1c12-463b-bbc7-72deed747ae7'

        it('should ignore parameters outside of limit offset', done => {
          request(app.server)
            .get(`/v1/account-requests?page=2&limit=1`)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) throw new Error(err)

              expect(res.body).to.be.an('array')
              expect(res.body).to.have.lengthOf(1)
              done()
            })
        })

        it('should limit acording to :limit', done => {
          request(app.server)
            .get(`/v1/account-requests?limit=2`)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) throw new Error(err)

              expect(res.body).to.be.an('array')
              expect(res.body).to.have.lengthOf(2)
              done()
            })
        })

        it('should offset acording to :offset', done => {
          request(app.server)
            .get(`/v1/account-requests?limit=1&offset=2`)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) throw new Error(err)

              expect(res.body).to.be.an('array')
              expect(res.body).to.have.lengthOf(1)
              expect(res.body[0]).to.deep.equal(blueprints.accountRequest.get(accountRequestId2))
              done()
            })
        })

        it('should default limit if not set', done => {
          request(app.server)
            .get(`/v1/account-requests?offset=0`)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) throw new Error(err)

              expect(res.body).to.be.an('array')
              expect(res.body).to.have.lengthOf(8)
              done()
            })
        })

        it('should default offset if not set', done => {
          request(app.server)
            .get(`/v1/account-requests?limit=1`)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) throw new Error(err)

              expect(res.body).to.be.an('array')
              expect(res.body).to.have.lengthOf(1)
              expect(res.body[0]).to.deep.equal(blueprints.accountRequest.get(accountRequestId))
              done()
            })
        })
      })

      describe('and sorting', () => {
        function doSortAndExpect(query, expectedArr, done) {
          request(app.server)
            .get(`/v1/account-requests?` + query)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) throw new Error(err)

              expect(res.body).to.have.lengthOf(8)
              res.body.forEach((item, index) => {
                expect(item.id).to.equal(expectedArr[index])
              })
              done()
            })
        }

        it('should 400 on invalid sort parameter', done => {
          request(app.server)
            .get(`/v1/account-requests?limit=1&sort=unexistent`)
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(400)
            .end(err => {
              if (err) throw new Error(err)
              done()
            })
        })

        it('should sort by creation date DESC by default', done => {
          const expected_ids = [
            '2552ab85-08da-4bb5-be00-9e94d282d348',
            '2552ab85-08da-4bb5-be00-9e94d282d347',
            '17ba2033-1c12-463b-bbc7-72deed747ae7',
            '17ba2033-1c12-463b-bbc7-72deed747ae8',
            '00000000-0000-aaaa-aaaa-000000000444',
            '00000000-0000-aaaa-aaaa-000000000333',
            '00000000-0000-aaaa-aaaa-000000000222',
            '00000000-0000-aaaa-aaaa-000000000111'
          ]

          doSortAndExpect('', expected_ids, done)
        })

        it('should sort by creation date DESC', done => {
          const expected_ids = [
            '2552ab85-08da-4bb5-be00-9e94d282d348',
            '2552ab85-08da-4bb5-be00-9e94d282d347',
            '17ba2033-1c12-463b-bbc7-72deed747ae7',
            '17ba2033-1c12-463b-bbc7-72deed747ae8',
            '00000000-0000-aaaa-aaaa-000000000444',
            '00000000-0000-aaaa-aaaa-000000000333',
            '00000000-0000-aaaa-aaaa-000000000222',
            '00000000-0000-aaaa-aaaa-000000000111'
          ]
          doSortAndExpect('sort=-createdAt', expected_ids, done)
        })

        it('should sort by creation date ASC', done => {
          const expected_ids = [
            '00000000-0000-aaaa-aaaa-000000000111',
            '00000000-0000-aaaa-aaaa-000000000222',
            '00000000-0000-aaaa-aaaa-000000000333',
            '00000000-0000-aaaa-aaaa-000000000444',
            '17ba2033-1c12-463b-bbc7-72deed747ae8',
            '17ba2033-1c12-463b-bbc7-72deed747ae7',
            '2552ab85-08da-4bb5-be00-9e94d282d347',
            '2552ab85-08da-4bb5-be00-9e94d282d348'
          ]
          doSortAndExpect('sort=createdAt', expected_ids, done)
        })

        it('should sort by status ASC', done => {
          const expected_ids = [
            '2552ab85-08da-4bb5-be00-9e94d282d348', // APPROVED
            '2552ab85-08da-4bb5-be00-9e94d282d347', // APPROVED
            '00000000-0000-aaaa-aaaa-000000000444', // APPROVED
            '00000000-0000-aaaa-aaaa-000000000222', // APPROVED
            '00000000-0000-aaaa-aaaa-000000000333', // INCOMPLETE
            '17ba2033-1c12-463b-bbc7-72deed747ae7', // PENDING
            '17ba2033-1c12-463b-bbc7-72deed747ae8', // PENDING
            '00000000-0000-aaaa-aaaa-000000000111'  // PENDING
          ]
          doSortAndExpect('sort=status', expected_ids, done)
        })

        it('should sort by status DESC', done => {
          const expected_ids = [
            '17ba2033-1c12-463b-bbc7-72deed747ae7', // PENDING
            '17ba2033-1c12-463b-bbc7-72deed747ae8', // PENDING
            '00000000-0000-aaaa-aaaa-000000000111', // PENDING
            '00000000-0000-aaaa-aaaa-000000000333', // INCOMPLETE
            '2552ab85-08da-4bb5-be00-9e94d282d348', // APPROVED
            '2552ab85-08da-4bb5-be00-9e94d282d347', // APPROVED
            '00000000-0000-aaaa-aaaa-000000000444', // APPROVED
            '00000000-0000-aaaa-aaaa-000000000222'  // APPROVED
          ]
          doSortAndExpect('sort=-status', expected_ids, done)
        })
      })
    })
  })
})
