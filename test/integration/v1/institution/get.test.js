describe('GET /institution/:domain', () => {
  let token

  beforeEach(async () => {
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')

    token = await helpers.getAuthToken()
  })

  it('should return 200 without auth', () => {
    return request(app.server)
      .get('/v1/institutions/wearesingular.com')
      .expect(200)
  })

  it('should return 200 with auth', () => {
    return request(app.server)
      .get('/v1/institutions/wearesingular.com')
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
  })

  it('should return valid institution object', () => {
    return request(app.server)
      .get('/v1/institutions/wearesingular.com')
      .set('Authorization', 'Bearer ' + token)
      .expect((res) => {
        const props = ['id', 'slug', 'name', 'domain', 'logoUri', 'backgroundImageUri']

        props.forEach(prop => {
          expect(res.body).to.have.own.property(prop)
        })

        expect(res.body).not.to.have.own.property('updatedAt')
        expect(res.body).not.to.have.own.property('createdAt')

        expect(res.body.id).to.be.an('string')
        expect(res.body.slug).to.be.an('string')
        expect(res.body.name).to.be.an('string')
        expect(res.body.domain).to.be.an('string')

        expect(res.body.logoUri).to.be.an('object')
        expect(res.body.logoUri).to.have.own.property('default')
        expect(res.body.backgroundImageUri).to.be.an('object')
        expect(res.body.backgroundImageUri).to.have.own.property('default')
      })
  })

  it('should 404 on not found', () => {
    return request(app.server)
      .get('/v1/institutions/notfound.com')
      .set('Authorization', 'Bearer ' + token)
      .expect(404)
  })

  it('should return institution data', () => {
    return request(app.server)
      .get('/v1/institutions/wearesingular.com')
      .set('Authorization', 'Bearer ' + token)
      .expect((res) => {
        expect(_.omit(res.body,['branchesCount', 'publicMetadata'])).to.deep.equal(_.omit(blueprints.institution.get('2552ab85-08da-4bb5-be00-9e94d282d311'), 'publicMetadata'))
      })
  })
})
