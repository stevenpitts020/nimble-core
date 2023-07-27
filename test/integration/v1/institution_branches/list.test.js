describe('GET /institution/:id/branches', () => {
  let token, id = "2552ab85-08da-4bb5-be00-9e94d282d311"

  beforeEach(async () => {
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institution_branches()
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')

    token = await helpers.getAuthToken()

  })

  it('should return 200 without auth', () => {
    return request(app.server)
      .get(`/v1/institutions/${id}/branches`)
      .expect(200)
  })

  it('should return 200 with auth', () => {
    return request(app.server)
      .get(`/v1/institutions/${id}/branches`)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
  })

  it('should return 404 if institution does not exist', () => {
    return request(app.server)
      .get('/v1/institutions/00000000-0000-0000-0000-000000000000/branches')
      .expect(404)
  })

  it('should return an array', () => {
    return request(app.server)
      .get(`/v1/institutions/${id}/branches`)
      .expect(200)
      .then(response => {
        expect(response.body).to.be.an('Array')
        expect(response.body).to.have.lengthOf(8)
      })
  })

  it('should return an array of expected objects', () => {
    return request(app.server)
      .get(`/v1/institutions/${id}/branches`)
      .expect(200)
      .then(response => {
        expect(response.body).to.be.an('Array')

        response.body.forEach(item => {
          expect(item).to.have.ownProperty('id')
          expect(item).to.have.ownProperty('name')
          expect(item).to.have.ownProperty('externalId')
        })

      })
  })

  it('should return expected data', () => {
    return request(app.server)
      .get(`/v1/institutions/${id}/branches`)
      .expect(200)
      .then(response => {
        expect(response.body).to.be.an('Array')
        const firstResult = response.body.shift()
        expect(firstResult).to.deep.equal({
          id: '2552ab85-0000-0000-0000-000000000001',
          name: 'branch 001',
          externalId: 'b001',
        })

      })
  })

  describe('When using Pagination', () => {
    it('should respect limit', () => {
      return request(app.server)
        .get(`/v1/institutions/${id}/branches?limit=2`)
        .expect(200)
        .then(response => {
          expect(response.body).to.have.lengthOf(2)
        })
    })

    it('should respect offset', () => {
      return request(app.server)
        .get(`/v1/institutions/${id}/branches?offset=7`)
        .expect(200)
        .then(response => {
          expect(response.body).to.have.lengthOf(1)
          expect(response.body.pop().id).to.equal('2552ab85-0000-0000-0000-000000000008')
        })
    })


    it('should respect limit and offset', () => {
      return request(app.server)
        .get(`/v1/institutions/${id}/branches?limit=1&offset=5`)
        .expect(200)
        .then(response => {
          expect(response.body).to.have.lengthOf(1)
          expect(response.body.pop().id).to.equal('2552ab85-0000-0000-0000-000000000006')
        })
    })

    it('should sort by name ASC', () => {
      return request(app.server)
        .get(`/v1/institutions/${id}/branches?limit=3`)
        .expect(200)
        .then(response => {
          expect(response.body).to.have.lengthOf(3)
          expect(response.body.shift().id).to.equal('2552ab85-0000-0000-0000-000000000001')
          expect(response.body.shift().id).to.equal('2552ab85-0000-0000-0000-000000000002')
          expect(response.body.shift().id).to.equal('2552ab85-0000-0000-0000-000000000003')
        })
    })
  })
})
