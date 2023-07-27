describe('app.services.docusignTemplate.fetch', () => {

  describe('method', async () => {
    it('should exist', () => {
      expect(app.services.docusignTemplate).to.have.ownProperty('fetch')
      expect(app.services.docusignTemplate.fetch).to.be.an('Function')
    })

    it('should complain if caled without params', async () => {
      const target = app.services.docusignTemplate.fetch
      return expect(target()).to.be.rejectedWith('"institutionId" is required')
    })

    it('should complain if caled with invalid params', async () => {
      const target = app.services.docusignTemplate.fetch
      return expect(target({ institutionId: 'aaa' })).to.be.rejectedWith('"institutionId" must be a valid GUID')
    })

    it('should complain if caled with invalid params', async () => {
      const target = app.services.docusignTemplate.fetch
      return expect(target({ version: 'aaaa' })).to.be.rejectedWith('"version" must be a number')
    })
  })


  describe('fetch', async () => {
    beforeEach(async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
      await seed.docusignTemplate.create()
    })

    it('should return error if it cannot find a template', async () => {
      try {
        await app.services.docusignTemplate.fetch({ institutionId: '2552ab85-08da-4bb5-be00-9e94d282d300', version: 1 })

      } catch (error) {
        expect(error).to.be.an.instanceof(Error)
        expect(error.message).to.equal('An error has occured, please contact support with the following code: no-docusign-templates-available')
      }
    })

    it('should return error if it cannot find a template by number', async () => {
      try {
        await app.services.docusignTemplate.fetch({ institutionId: '2552ab85-08da-4bb5-be00-9e94d282d311', version: 2 })

      } catch (error) {
        expect(error).to.be.an.instanceof(Error)
        expect(error.message).to.equal('An error has occured, please contact support with the following code: no-docusign-templates-available')
      }
    })

    it('should return a valid object', async () => {
      const target = await app.services.docusignTemplate.fetch({ institutionId: '2552ab85-08da-4bb5-be00-9e94d282d311', version: 1 })

      expect(target).to.be.an('object')

      // schema
      expect(target).to.have.ownProperty('AccountApplication')
      expect(target).to.have.ownProperty('FundsAvail')

      // type
      expect(target.AccountApplication).to.be.an('string')
    })

    it('should return a list of all templates', async () => {

      const target = await app.services.docusignTemplate.fetch({ institutionId: '2552ab85-08da-4bb5-be00-9e94d282d311', version: 1 })

      const expectation = {
        "AccountApplication": "b60fec89-18e3-41b8-8873-808d3c665569",
        "FundsAvail": "05db6673-5bb1-421f-be65-c71580bc28a9",
        "EFT": "e241451d-a10b-41ab-b1fc-37be09e3880b",
        "Fees": "c2b862c6-7827-46a1-bdcd-fea345785daa",
        "Privacy": "5d397906-e438-4597-b5e7-fb6c3d5a1217",
        "Terms": "5313cde2-5926-47b1-b358-56cc7bb786cc",
        "TIS Platinum Checking": "597e96c5-7f5a-485b-94d4-10d9f7a44979",
        "TIS Shamrock": "a6b2275c-a784-46da-9863-6e3c085a5aad",
        "TIS Simple Checking": "914b5f11-dbf4-4290-a43f-3243d728bb0b",
        "TIS Classing Savings": "f25542b1-c8a0-4e3f-9a7b-941a3c3484c0",
        "TIS Money Market": "517cd5c7-be62-4d78-93df-b379b99d4d05",
        "TIS Platinum Money Market": "ecd5df78-d3e4-4234-b643-3a711b4cc09c",
        "Disclosure": "dbd0e2d3-91ef-49fc-997c-a3b8b974d17c",
      }
      expect(target).to.deep.equal(expectation)
    })
  })
})
