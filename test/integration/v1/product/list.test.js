const fakeInstitutionId = 'ffffffff-aaaa-bbbb-b000-999999999999' // non-existent id
const testInstitution1 = '2552ab85-08da-4bb5-be00-9e94d282d312'
const testInstitution2 = '2552ab85-08da-4bb5-be00-9e94d282d311'
const testProduct10 = '3552ab85-08da-4bb5-be00-9e94d282d310'
const testProduct40 = '3552ab85-08da-4bb5-be00-9e94d282d340'
const testProduct50 = '3552ab85-08da-4bb5-be00-9e94d282d350'

describe(`GET /v1/institutions/:id/products`, () => {
  beforeEach(async () => {
    await seed.institution.create(testInstitution1)
    await seed.product.create(testProduct40)
    await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d310')
    await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d311')
    await seed.productOption.create('3552ab85-0000-0000-0000-9e94d282d312')
    await seed.productOption.create('7b9c52a2-c542-4031-8342-5fa29a2f6d0d')
  })

  it('should return 200 without auth', () => {
    return request(app.server).get(`/v1/institutions/${testInstitution1}/products`).expect(200)
  })

  it('should return 200 with auth', async () => {
    const token = await helpers.getAuthToken()
    return request(app.server)
      .get(`/v1/institutions/${testInstitution1}/products`)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
  })

  it('should return 404 with non-existent institution id', () => {
    return request(app.server)
      .get(`/v1/institutions/${fakeInstitutionId}/products`)
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).to.equal(404)
        expect(res.body.message).to.be.a('string')
      })
  })

  it('should return valid product object', () => {
    return request(app.server)
      .get(`/v1/institutions/${testInstitution1}/products?limit=1`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        const props = ['id', 'name', 'category', 'summary', 'content', 'options', 'createdAt']

        expect(res.body).to.have.lengthOf(1)

        const [product] = res.body
        props.forEach((prop) => expect(product).to.have.own.property(prop))

        expect(product.id).to.be.an('string')
        expect(product.name).to.be.an('string')
        expect(product.category).to.be.an('string')
        expect(product.summary).to.be.an('string')
        expect(product.content).to.be.an('string')
        expect(product.options).to.be.an('array')

        expect(product).not.to.have.own.property('contentRaw')
        expect(product).not.to.have.own.property('updatedAt')
        expect(product).not.to.have.own.property('institution')
      })
  })

  describe('with multiple data', () => {
    beforeEach(async () => {
      await seed.product.create(testProduct50)

      // To ensure products from other institutions are not returned
      await seed.institution.create(testInstitution2)
      await seed.product.create(testProduct10)
    })

    it('should not return products of other institutions', () => {
      return request(app.server)
        .get(`/v1/institutions/${testInstitution1}/products?limit=10&sort=id`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array')
          const ids = res.body.map((p) => p.id)
          expect(ids).not.to.include(testProduct10)
          expect(ids).to.include(testProduct40)
          expect(ids).to.include(testProduct50)
        })
    })

    it('should return a list of products', () => {
      return request(app.server)
        .get(`/v1/institutions/${testInstitution1}/products?limit=1&sort=id`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.lengthOf(1)
          expect(res.body[0]).to.deep.equal(blueprints.product.get(testProduct40))
        })
    })

    it('should ignore parameters outside of limit offset', () => {
      return request(app.server)
        .get(`/v1/institutions/${testInstitution1}/products?page=2&limit=1`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.lengthOf(1)
          expect(res.body[0]).to.deep.equal(blueprints.product.get(testProduct50))
        })
    })

    it('should 400 on invalid sort parameter', () => {
      return request(app.server)
        .get(`/v1/institutions/${testInstitution1}/products?limit=1&sort=unexistent`)
        .expect('Content-Type', /json/)
        .expect(400)
    })

    it('should 200 on sort by name', () => {
      return request(app.server)
        .get(`/v1/institutions/${testInstitution1}/products?limit=1&sort=name`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.lengthOf(1)
        })
    })

    it('should limit acording to :limit', () => {
      return request(app.server)
        .get(`/v1/institutions/${testInstitution1}/products?limit=1`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.lengthOf(1)
        })
    })

    it('should offset acording to :offset', () => {
      return request(app.server)
        .get(`/v1/institutions/${testInstitution1}/products?limit=1&offset=1&sort=id`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.lengthOf(1)
          expect(res.body[0].id).to.equal(blueprints.product.get(testProduct50).id)
        })
    })

    describe('with paging defaults', () => {
      it('should default limit if not set', () => {
        return request(app.server)
          .get(`/v1/institutions/${testInstitution1}/products?offset=0`)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect((res) => {
            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(2)
          })
      })

      it('should default offset if not set', () => {
        return request(app.server)
          .get(`/v1/institutions/${testInstitution1}/products?limit=1&sort=id`)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect((res) => {
            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].id).to.equal(blueprints.product.get(testProduct40).id)
          })
      })
    })
  })
})
