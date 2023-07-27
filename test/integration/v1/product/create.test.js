const institutionId = '2552ab85-08da-4bb5-be00-9e94d282d312'
const prodId = '3552ab85-08da-4bb5-be00-9e94d282d350'

describe('POST /institutions/:id/products', () => {
  let product

  beforeEach(async () => {
    await seed.institution.create(institutionId)
    product = _.omit(blueprints.product.get(prodId), ['id', 'createdAt', 'content', 'options'])
    product.contentRaw = 'An **example** markdown'
  })

  it('should return 401 when apikey not present', () => {
    return request(app.server)
      .post(`/v1/institutions/${institutionId}/products`)
      .send(product)
      .expect('Content-Type', /json/)
      .expect(401)
  })

  describe('when validating entities', () => {
    it('should return 400', () => {
      return request(app.server)
        .post(`/v1/institutions/${institutionId}/products`)
        .set('X-API-KEY', 'superpowers')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400)
    })

    it('should return error details', () => {
      return request(app.server)
        .post(`/v1/institutions/${institutionId}/products`)
        .set('X-API-KEY', 'superpowers')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).not.to.be.undefined
          expect(res.body.message).not.to.contain('"id" is required')
          expect(res.body.message).to.contain('"name" is required')
          expect(res.body.message).to.contain('"sku" is required')
          expect(res.body.message).to.contain('"category" is required')
          expect(res.body.message).to.contain('"summary" is required')
          expect(res.body.message).to.contain('"contentRaw" is required')
        })
    })

    it('should return error with not-allowed properties', () => {
      return request(app.server)
        .post(`/v1/institutions/${institutionId}/products`)
        .set('X-API-KEY', 'superpowers')
        .send({ ...product, title: 'A product title' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).to.contain('"title" is not allowed')
        })
    })

    describe('category', () => {

      it(`should return 400 with non allowed category`, async () => {
        await request(app.server)
          .post(`/v1/institutions/${institutionId}/products`)
          .set('X-API-KEY', 'superpowers')
          .send({ ...product, category: 'NOT VALID CATEGORY' })
          .expect(400)
      })

      new Array('SAVINGS', 'CHECKING', 'CD').forEach(category => {
        it(`should return 201 with ${category} as a valid category`, async () => {
          await request(app.server)
            .post(`/v1/institutions/${institutionId}/products`)
            .set('X-API-KEY', 'superpowers')
            .send({ ...product, category })
            .expect(201)
        })
      })
    })
  })

  it('should return 201 on successful created', () => {
    return request(app.server)
      .post(`/v1/institutions/${institutionId}/products`)
      .set('X-API-KEY', 'superpowers')
      .send(product)
      .expect('Content-Type', /json/)
      .expect(201)
  })

  it('should return a product model', () => {
    return request(app.server)
      .post(`/v1/institutions/${institutionId}/products`)
      .set('X-API-KEY', 'superpowers')
      .send(product)
      .expect('Content-Type', /json/)
      .expect((res) => {
        let props = ['id', 'name', 'category', 'summary', 'content', 'createdAt']
        props.forEach((prop) => expect(res.body).to.have.own.property(prop))

        expect(res.body.id).to.be.an('string')
        expect(res.body.name).to.equal(product.name)
        expect(res.body.category).to.equal(product.category)
        expect(res.body.summary).to.equal(product.summary)
        expect(res.body.content).to.equal('<p>An <strong>example</strong> markdown</p>\n')
        expect(res.body.createdAt).to.be.an('string')

        expect(res.body).not.to.have.own.property('contentRaw')
        expect(res.body).not.to.have.own.property('updatedAt')
      })
  })

  it('should persist product', async () => {
    // First prove the product does not exist
    await request(app.server)
      .get(`/v1/institutions/${institutionId}/products`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        const newProducts = res.body.filter((p) => p.name === product.name)
        expect(newProducts.length).to.equal(0)
      })

    // Create the product
    await request(app.server)
      .post(`/v1/institutions/${institutionId}/products`)
      .set('X-API-KEY', 'superpowers')
      .send(product)
      .expect(201)

    // Prove the product now exists
    return request(app.server)
      .get(`/v1/institutions/${institutionId}/products`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        const newProducts = res.body.filter((p) => p.name === product.name)
        expect(newProducts.length).to.equal(1)
      })
  })

  describe('when entity exists', () => {
    beforeEach(() => {
      seed.product.create(prodId)
    })

    it('should return 409', () => {
      return request(app.server)
        .post(`/v1/institutions/${institutionId}/products`)
        .set('X-API-KEY', 'superpowers')
        .send(product)
        .expect('Content-Type', /json/)
        .expect(409)
    })
  })

  describe('when institution does not exist', () => {
    it('should return 404', () => {
      const fakeId = 'ffffffff-aaaa-bbbb-b000-999999999999' // non-existent id
      return request(app.server)
        .post(`/v1/institutions/${fakeId}/products`)
        .set('X-API-KEY', 'superpowers')
        .send(product)
        .expect('Content-Type', /json/)
        .expect(404)
    })
  })
})
