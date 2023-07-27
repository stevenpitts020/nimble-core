const _ = require('lodash')

describe('POST /account_requests', async () => {
  let newAccountRequest

  before(() => {
    nock.enable()
  })

  after(() => {
    sinon.restore()
    nock.enableNetConnect()
  })

  beforeEach(async () => {
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.document.create('a74f9092-5889-430a-9c19-6712f9f68090')
    await seed.productAccountNumber.create()

    // defualt product
    await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d310')

    // product with options
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
    await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d340')
    await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d310')
    await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d311')
    await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d312')

    newAccountRequest = {
      institutionId: '2552ab85-08da-4bb5-be00-9e94d282d311',
      productConfigurations: [{ initialDeposit: 50099, productId: '3552ab85-08da-4bb5-be00-9e94d282d310' }],
    }
  })

  afterEach(() => {
    sinon.reset()
    nock.cleanAll()
  })

  function post(payload) {
    return request(app.server)
      .post('/v1/account-requests')
      .send(payload)
      .expect('Content-Type', /json/)
  }

  describe('when validating', () => {
    it('should complain about empty schema', async () => {
      return post({}).expect(400)
    })

    describe('the schema', () => {
      [
        'institutionId',
      ].forEach(field => {
        it(`should complain about missing ${field}`, async () => {
          return post(_.omit(newAccountRequest, field))
            .expect(400)
            .expect(res => {
              expect(res.body.message).to.contain(`"${field}" is required`)
            })
        })
      })
    })

    it('should complain about invalid institutionId', async () => {
      return post({ ...newAccountRequest, institutionId: '2552ab85-aaaa-bbbb-cccc-9e94d282d311' }).expect(404)
    })
  })

  it('should return 201', async () => {
    return post(newAccountRequest).expect(201)
  })

  it('should return the newly created account_request', async () => {
    return post(newAccountRequest)
      .expect(201)
      .expect(res => {
        expect(res.body).to.have.ownProperty('signers')
        expect(res.body.signers).to.be.an('array')
        expect(res.body.signers).to.have.lengthOf(0)
        expect(res.body.productConfigurations[0].productId).to.equal(newAccountRequest.productConfigurations[0].productId)
        expect(res.body.productConfigurations[0].initialDeposit).to.equal(newAccountRequest.productConfigurations[0].initialDeposit)
      })
  })

  /**
   * Test account number
   */
  describe('the account number', () => {
    it('should fail if no available account numbers for this institution', async () => {
      await knex.raw('DELETE FROM product_account_numbers')
      return post(newAccountRequest)
        .expect(409)
        .expect(res => {
          expect(res.body.message).to.contain(' please contact support with the following code')
        })
    })

    it('should assign an account number to the product', async () => {
      return post(newAccountRequest)
        .expect(201)
        .then(async () => {
          const q = await knex.raw(`SELECT * FROM product_account_numbers WHERE account_number='TEST_SINGULAR_001'`)
          return expect(q.rows[0].account_request_id).not.to.equal(null)
        })
    })

    it('should prevent the account number of being assigned twice', async () => {
      return Promise.all([
        await post(newAccountRequest),
        await post(newAccountRequest),
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
      return post(newAccountRequest)
        .expect(201)
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
      return post(newAccountRequest)
        .expect(201)
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
    it('should fail if products is missing', async () => {
      return post(_.omit(newAccountRequest, 'productConfigurations'))
        .expect(400)
        .expect(res => {
          expect(res.body.message).to.contain('"productConfigurations" is required')
        })
    })

    describe('the initial Amount', () => {
      it('should complain about invalid initial deposit amount', async () => {
        return post({ ...newAccountRequest, productConfigurations: [{ initialDeposit: 'xxx', productId: '3552ab85-08da-4bb5-be00-9e94d282d310' }] })
          .expect(400)
          .expect(res => {
            expect(res.body.message).to.contain('"productConfigurations[0].initialDeposit" must be a number')
          })
      })

      it('should complain about invalid initial amount in cents', async () => {
        return post({ ...newAccountRequest, productConfigurations: [{ initialDeposit: '200.40', productId: '3552ab85-08da-4bb5-be00-9e94d282d310' }] })
          .expect(400)
          .expect(res => {
            expect(res.body.message).to.contain('"productConfigurations[0].initialDeposit" must be an integer')
          })
      })

      it('should complain about null initial amount', async () => {
        return post({ ...newAccountRequest, productConfigurations: [{ initialDeposit: null, productId: '3552ab85-08da-4bb5-be00-9e94d282d310' }] })
          .expect(400)
          .expect(res => {
            expect(res.body.message).to.contain('"productConfigurations[0].initialDeposit" must be a number')
          })
      })

      it('should not complain about initial amount being 0', async () => {
        return post({ ...newAccountRequest, productConfigurations: [{ initialDeposit: 0, productId: '3552ab85-08da-4bb5-be00-9e94d282d310' }] })
          .expect(201)
          .expect(res => {
            expect(res.body.productConfigurations[0].initialDeposit).to.equal(0)
          })
      })
    })

    describe('the product options', () => {
      const accountRequestWithOptions = {
        institutionId: '2552ab85-08da-4bb5-be00-9e94d282d312',
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
        return post(accountRequestWithOptions).expect(201).then(async () => {
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
          return post(target).expect(201)
        })

        it('should allow empty options', () => {
          const target = {
            ...accountRequestWithOptions,
            productConfigurations: [{ ...accountRequestWithOptions.productConfigurations[0], options: [] }]
          }
          return post(target).expect(201)
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
          return post(target).expect(400).expect(res => {
            expect(res.body.message).to.contain('"productConfigurations[0].options[0].invalid" is not allowed')
            expect(res.body.message).to.contain('"productConfigurations[0].options[0].key" is required')
            expect(res.body.message).to.contain('"productConfigurations[0].options[0].category" is required')
            expect(res.body.message).to.contain('"productConfigurations[0].options[0].title" is required')
            expect(res.body.message).to.contain('"productConfigurations[0].options[0].value" is required')
          })
        })

        it('should accept a valid set of options', () => {
          return post(accountRequestWithOptions).expect(201)
        })

      })
    })

    it('shoult fail if products is empty', async () => {
      return post({ ...newAccountRequest, productConfigurations: [] })
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
      return post({ ...newAccountRequest, productConfigurations })
        .expect(400)
        .expect(res => {
          expect(res.body.message).to.contain('"productConfigurations" must contain less than or equal to 1 items')
        })
    })

    it('should return the products selected as product configuration', async () => {
      return post(newAccountRequest)
        .expect(201)
        .expect(res => {
          expect(res.body.productConfigurations).to.be.an('array')
          expect(res.body.productConfigurations[0]).to.have.ownProperty('productId')
          expect(res.body.productConfigurations[0]).to.have.ownProperty('initialDeposit')
          expect(res.body.productConfigurations[0]).to.have.ownProperty('createdAt')

          expect(res.body.productConfigurations[0].initialDeposit).to.equal(50099)
        })
    })
  })
})
