const _ = require('lodash')

describe('PUT /account_requests/:id', async () => {
  const accountRequestId = '17ba2033-1c12-463b-bbc7-72deed747ae8'
  let clock, accountRequest

  before(() => {
    clock = sinon.useFakeTimers({ toFake: ['Date'] })
  })

  after(() => {
    clock.restore()
  })
  afterEach(() => {
    sinon.restore()
  })

  beforeEach(async () => {
    await seed.institution.create()
    await seed.institutionBranch.create()
    await seed.productAccountNumber.create()
    await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d310')
    await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d340') // required by seed.account_request_products
    await seed.product_options()
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.document.create()
    await seed.accountRequest.create(accountRequestId)
    await seed.account_request_products() // insert all
    await seed.account_request_product_options() // insert all

    // put account request on a state it can be updated
    await knex.raw(`UPDATE account_requests SET status = 'DRAFT' WHERE id='${accountRequestId}'`)

    accountRequest = {
      id: accountRequestId,
      productConfigurations: [{ initialDeposit: 50099, productId: '3552ab85-08da-4bb5-be00-9e94d282d310' }],
    }
  })

  describe('Token', () => {
    function put(
      payload,
      accountRequestId = '17ba2033-1c12-463b-bbc7-72deed747ae8'
    ) {
      const token = app.services.token.get({
        scopes: ['account_requests'],
        resources: [`account_requests#${accountRequestId}`],
        expiration: 10
      })

      return request(app.server)
        .put(`/v1/account-requests/${accountRequestId}`)
        .set('Authorization', 'Bearer ' + token)
        .send(payload)
        .expect('Content-Type', /json/)
    }

    describe('when validating token', () => {
      it('should complain about missing auth', async () => {
        return request(app.server)
          .put(`/v1/account-requests/${accountRequestId}`)
          .expect('Content-Type', /json/)
          .expect(401)
      })

      it('should complain if auth token is invalid', async () => {
        return request(app.server)
          .put(`/v1/account-requests/${accountRequestId}`)
          .set('Authorization', 'Bearer ' + 'AAAA')
          .expect('Content-Type', /json/)
          .expect(401)
      })

      it('should complain if auth token is from the wrong account request', async () => {
        const token = app.services.token.get({
          scopes: ['account_requests'],
          resources: ['account_requests#00000000-0000-0000-0000-4bd8aa454722}'],
          expiration: 10
        })
        return request(app.server)
          .put(`/v1/account-requests/${accountRequestId}`)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(403)
      })
    })

    describe('when validating', () => {
      it('should allow empty schema', async () => {
        return put({}).expect(200)
      })

      it('should return 412 when updating product configurations on status NOT DRAFT or INCOMPLETE', async () => {
        await knex.raw(`UPDATE account_requests SET status = 'PENDING' WHERE id='${accountRequestId}'`)

        return put(accountRequest)
          .expect(412)
          .expect(res => {
            expect(res.body.message).to.contain('Can only update product configurations on status DRAFT or INCOMPLETE')
          })
      })
    })

    describe('with valid auth', () => {
      it('should return 200', async () => {
        return put(accountRequest)
          .expect(200)
      })

      it('should return the newly updated account request', async () => {
        return put(accountRequest)
          .expect(200)
          .expect(res => {
            expect(res.body).to.have.ownProperty('signers')
            expect(res.body.signers).to.be.an('array')
            expect(res.body.signers).to.have.lengthOf(0)
            expect(res.body.productConfigurations[0].productId).to.equal(accountRequest.productConfigurations[0].productId)
            expect(res.body.productConfigurations[0].initialDeposit).to.equal(accountRequest.productConfigurations[0].initialDeposit)
          })
      })

      /**
       * Test account number
       */
      describe('the account number', () => {
        it('should fail if no available account numbers for this institution', async () => {
          await knex.raw('DELETE FROM product_account_numbers')
          return put(accountRequest)
            .expect(409)
            .expect(res => {
              expect(res.body.message).to.contain(' please contact support with the following code')
            })
        })

        it('should assign an account number to the product', async () => {
          return put(accountRequest)
            .expect(200)
            .then(async () => {
              const q = await knex.raw(`SELECT * FROM product_account_numbers WHERE account_number='TEST_SINGULAR_001'`)
              return expect(q.rows[0].account_request_id).not.to.equal(null)
            })
        })

        it('should prevent the account number of being assigned twice', async () => {
          return Promise.all([
            await put(accountRequest),
            await put(accountRequest),
          ]).then(async () => {
            const q1 = await knex.raw(`SELECT * FROM product_account_numbers WHERE account_number='TEST_SINGULAR_001'`)
            const q2 = await knex.raw(`SELECT * FROM product_account_numbers WHERE account_number='TEST_SINGULAR_002'`)
            const q3 = await knex.raw(`SELECT * FROM product_account_numbers WHERE account_number='TEST_SINGULAR_003'`)

            expect(q1.rows[0].account_request_id).not.to.equal(null)
            expect(q2.rows[0].account_request_id).not.to.equal(null)
            expect(q3.rows[0].account_request_id).to.equal(null)
            return
          })
        })

        it('should assign the youngest available account_number', async () => {
          await knex.raw(`UPDATE product_account_numbers SET account_request_id = '59a2145e-fcae-4078-af11-eca83fdec8a8' WHERE account_number='TEST_SINGULAR_003'`)
          return put(accountRequest)
            .expect(200)
            .then(async () => {
              const q1 = await knex.raw(`SELECT * FROM product_account_numbers WHERE account_number='TEST_SINGULAR_001'`)
              const q2 = await knex.raw(`SELECT * FROM product_account_numbers WHERE account_number='TEST_SINGULAR_002'`)
              const q3 = await knex.raw(`SELECT * FROM product_account_numbers WHERE account_number='TEST_SINGULAR_003'`)

              expect(q1.rows[0].account_request_id).not.to.equal(null)
              expect(q2.rows[0].account_request_id).to.equal(null)
              expect(q3.rows[0].account_request_id).to.equal('59a2145e-fcae-4078-af11-eca83fdec8a8')
            })
        })

        it('should save the account number as a product option', async () => {
          return put(accountRequest)
            .expect(200)
            .then(async () => {
              const option = (
                await knex.raw(`SELECT * FROM account_request_product_options`)
              ).rows.find(o => o.category === 'account_number')

              expect(option).not.to.be.undefined
              expect(option).to.be.an('object')
              expect(option.key).to.equal('account_number')
              expect(option.category).to.equal('account_number')
              expect(option.title).to.equal('Account Number')
              expect(option.value).to.equal('TEST_SINGULAR_001')
            })
        })
      })

      /**
       * Test the Products
       */
      describe('the products selected', () => {
        it('should not fail if products is missing', async () => {
          return put(_.omit(accountRequest, 'productConfigurations'))
            .expect(200)
        })

        describe('the initial Amount', () => {
          it('should complain about invalid initial deposit amount', async () => {
            return put({ ...accountRequest, productConfigurations: [{ initialDeposit: 'xxx', productId: '3552ab85-08da-4bb5-be00-9e94d282d310' }] })
              .expect(400)
              .expect(res => {
                expect(res.body.message).to.contain('"productConfigurations[0].initialDeposit" must be a number')
              })
          })

          it('should complain about invalid initial amount in cents', async () => {
            return put({ ...accountRequest, productConfigurations: [{ initialDeposit: '200.40', productId: '3552ab85-08da-4bb5-be00-9e94d282d310' }] })
              .expect(400)
              .expect(res => {
                expect(res.body.message).to.contain('"productConfigurations[0].initialDeposit" must be an integer')
              })
          })

          it('should complain about null initial amount', async () => {
            return put({ ...accountRequest, productConfigurations: [{ initialDeposit: null, productId: '3552ab85-08da-4bb5-be00-9e94d282d310' }] })
              .expect(400)
              .expect(res => {
                expect(res.body.message).to.contain('"productConfigurations[0].initialDeposit" must be a number')
              })
          })

          it('should not complain about initial amount being 0', async () => {
            return put({ ...accountRequest, productConfigurations: [{ initialDeposit: 0, productId: '3552ab85-08da-4bb5-be00-9e94d282d310' }] })
              .expect(200)
              .expect(res => {
                expect(res.body.productConfigurations[0].initialDeposit).to.equal(0)
              })
          })
        })

        describe('the product options', () => {
          const accountRequestWithOptions = {
            productConfigurations: [
              {
                initialDeposit: '50099',
                productId: '3552ab85-08da-4bb5-be00-9e94d282d340',
                options: [
                  { key: 'optionA', title: 'Option A', value: 'VALUE A', category: 'some-choice' },
                  { key: 'optionB', title: 'Option B', value: 'VALUE B', category: 'another-choice' }
                ]
              }
            ]
          }

          it('should persist the options in the database', async () => {
            return put(accountRequestWithOptions)
              .expect(200)
              .then(async () => {
                let data = await knex.raw('SELECT * FROM account_request_product_options order by key')

                data.rows.shift() //account_number
                const optionA = data.rows.shift()
                const optionB = data.rows.shift()

                expect(optionA.product_id).to.equal('3552ab85-08da-4bb5-be00-9e94d282d340')
                expect(optionA.key).to.equal('optionA')
                expect(optionA.title).to.equal('Option A')
                expect(optionA.value).to.equal('VALUE A')
                expect(optionA.category).to.equal('some-choice')

                expect(optionB.product_id).to.equal('3552ab85-08da-4bb5-be00-9e94d282d340')
                expect(optionB.key).to.equal('optionB')
                expect(optionB.title).to.equal('Option B')
                expect(optionB.value).to.equal('VALUE B')
                expect(optionB.category).to.equal('another-choice')
              })
          })

          describe('validation', () => {
            it('should allow missing options', () => {
              const target = {
                ...accountRequestWithOptions,
                productConfigurations: [_.omit(accountRequestWithOptions.productConfigurations[0], 'options')]
              }
              return put(target).expect(200)
            })

            it('should allow empty options', () => {
              const target = {
                ...accountRequestWithOptions,
                productConfigurations: [{ ...accountRequestWithOptions.productConfigurations[0], options: [] }]
              }
              return put(target).expect(200)
            })

            it('should validate options object', () => {
              const target = {
                ...accountRequestWithOptions,
                productConfigurations: [{
                  ...accountRequestWithOptions.productConfigurations[0], options: [
                    { invalid: 'prop' }
                  ]
                }]
              }
              return put(target).expect(400).expect(res => {
                expect(res.body.message).to.contain('"productConfigurations[0].options[0].invalid" is not allowed')
                expect(res.body.message).to.contain('"productConfigurations[0].options[0].key" is required')
                expect(res.body.message).to.contain('"productConfigurations[0].options[0].category" is required')
                expect(res.body.message).to.contain('"productConfigurations[0].options[0].title" is required')
                expect(res.body.message).to.contain('"productConfigurations[0].options[0].value" is required')
              })
            })

            it('should accept a valid set of options', () => {
              return put(accountRequestWithOptions).expect(200)
            })

          })
        })

        it('shoult fail if products is empty', async () => {
          return put({ ...accountRequest, productConfigurations: [] })
            .expect(400)
            .expect(res => {
              expect(res.body.message).to.contain('"productConfigurations" must contain at least 1 items')
            })
        })

        it('shoult fail if products exceeds limit', async () => {
          const productConfigurations = [
            { productId: '3552ab85-08da-4bb5-be00-9e94d282d310' },
            { productId: '3552ab85-08da-4bb5-be00-9e94d282d340' }
          ]
          return put({ ...accountRequest, productConfigurations })
            .expect(400)
            .expect(res => {
              expect(res.body.message).to.contain('"productConfigurations" must contain less than or equal to 1 items')
            })
        })

        it('should return the products selected as product configuration', async () => {
          return put(accountRequest)
            .expect(200)
            .expect(res => {
              expect(res.body.productConfigurations).to.be.an('array')
              expect(res.body.productConfigurations[0]).to.have.ownProperty('productId')
              expect(res.body.productConfigurations[0]).to.have.ownProperty('initialDeposit')
              expect(res.body.productConfigurations[0]).to.have.ownProperty('createdAt')

              expect(res.body.productConfigurations[0].initialDeposit).to.equal(50099)
            })
        })
      })

      /**
       * Test status update
       */
      describe('when updating status', () => {
        it('should return 200 when updating status from DRAFT to INCOMPLETE', async () => {
          return put({ status: 'INCOMPLETE' }).expect(200)
        })


        it('should trigger the creation of the docusign contract when updating from DRAFT to INCOMPLETE', async () => {

          const contractSendSpy = sinon.spy(app.services.contract, 'send')
          return put({ status: 'INCOMPLETE' })
            .expect(200)
            .expect(res => {
              expect(contractSendSpy).to.have.been.calledOnce
              expect(contractSendSpy).to.have.been.calledWith(res.body.id)
            })
        })

        it('should return 412 when updating status from NOT DRAFT to INCOMPLETE', async () => {
          await knex.raw(`UPDATE account_requests SET status = 'PENDING' WHERE id='${accountRequestId}'`)

          return put({ status: 'INCOMPLETE' })
            .expect(412)
            .expect(res => {
              expect(res.body.message).to.contain('Status can only be changed to INCOMPLETE if it was previously DRAFT')
            })
        })
      })
    })
  })
})
