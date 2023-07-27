const axios = require('axios')
const sinon = require('sinon')
const mocks = require('../../../support/mock/comply_advantage')
const uuid = require('uuid')

axios.defaults.adapter = require('axios/lib/adapters/http')

const fakeUser = {
  'id': uuid.v4(),
  'firstName': 'George',
  'lastName': 'Constanza',
  'middleName': 'j',
  'dateOfBirth': '2020-10-10',
  'status': 'PENDING'
}

describe('app.services.compliance.verify', () => {
  afterEach(() => {
    sinon.restore()
  })

  describe('search', async () => {

    it('should exist as a method', () => {
      expect(app.services.compliance).to.have.ownProperty('parse')
      expect(app.services.compliance.verify).to.be.an('Function')
    })


    describe('validations', () => {
      it('should throw exception if not provided with parameters', async () => {
        return expect(app.services.compliance.verify()).to.be.rejectedWith()
      })

      it('should throw exception if not provided with a valid uuid', async () => {
        return expect(app.services.compliance.verify('string')).to.be.rejectedWith()
      })

      it('should throw exception if the user can\'t be found', async () => {
        return expect(app.services.compliance.verify(uuid.v4())).to.be.rejectedWith('The requested resource couldn\'t be found')
      })
    })

    it('should not call compliance.search if the user is INVITED', async () => {
      const fakeUserGet = sinon.replace(app.services.signer, 'get', sinon.fake.returns({ ...fakeUser, status: 'INVITED' }))
      const fakeComplianceSearch = sinon.replace(app.services.compliance, 'search', sinon.fake.returns({}))
      const fakeComplianceExport = sinon.replace(app.services.compliance, 'export', sinon.fake.returns({}))

      // call target
      await app.services.compliance.verify(fakeUser.id)

      expect(fakeUserGet).to.have.been.calledWith(fakeUser.id)
      expect(fakeComplianceSearch).not.to.have.been.called
      expect(fakeComplianceExport).not.to.have.been.called
    })

    it('should not call compliance.search if the user is INCOMPLETE', async () => {
      const fakeUserGet = sinon.replace(app.services.signer, 'get', sinon.fake.returns({ ...fakeUser, status: 'INCOMPLETE' }))
      const fakeComplianceSearch = sinon.replace(app.services.compliance, 'search', sinon.fake.returns({}))
      const fakeComplianceExport = sinon.replace(app.services.compliance, 'export', sinon.fake.returns({}))

      // call target
      await app.services.compliance.verify(fakeUser.id)

      expect(fakeUserGet).to.have.been.calledWith(fakeUser.id)
      expect(fakeComplianceSearch).not.to.have.been.called
      expect(fakeComplianceExport).not.to.have.been.called
    })

    it('should call compliance.search with the user name', async () => {
      const fakeUserGet = sinon.replace(app.services.signer, 'get', sinon.fake.returns(fakeUser))
      const fakeComplianceSearch = sinon.replace(app.services.compliance, 'search', sinon.fake.returns({ search: {}, result: { id: 123 }, hits: [] }))
      const fakeComplianceExport = sinon.replace(app.services.compliance, 'export', sinon.fake.returns({ id: '00000000-0000-0000-0000-000000000000' }))
      const fakeComplianceParse = sinon.replace(app.services.compliance, 'parse', sinon.fake.returns(mocks.parsedResult))
      sinon.replace(app.services.complianceVerification, 'create', sinon.fake.returns(uuid.v4))

      // call target
      await app.services.compliance.verify(fakeUser.id)

      const payload = {
        firstName: fakeUser.firstName,
        lastName: fakeUser.lastName,
        middleName: fakeUser.middleName,
        dateOfBirth: fakeUser.dateOfBirth
      }
      const filters = ['sanction', 'pep', 'adverse-media', 'adverse-media-financial-crime']

      expect(fakeUserGet).to.have.been.calledWith(fakeUser.id)
      expect(fakeComplianceSearch).to.have.been.calledWith(payload, filters)
      expect(fakeComplianceExport).to.have.been.calledWith(123)
      expect(fakeComplianceParse).to.have.been.calledWith({ search: {}, result: { id: 123 }, hits: [] })

    })

    it('should call create app.services.complianceVerification.create', async () => {
      sinon.replace(app.services.signer, 'get', sinon.fake.returns(fakeUser))
      sinon.replace(app.services.compliance, 'search', sinon.fake.returns({ search: {}, result: { id: 123 }, hits: [] }))
      sinon.replace(app.services.compliance, 'export', sinon.fake.returns({ id: '00000000-0000-0000-0000-000000000000' }))
      sinon.replace(app.services.compliance, 'parse', sinon.fake.returns(mocks.parsedResult))

      const fakeForgeForVerification = sinon.replace(app.repositories.signerComplianceVerification, 'forge', sinon.fake.returns({ save: () => ({ id: 'fake-signerComplianceVerificationId' }) }))
      const fakeForgeForVerificationItem = sinon.replace(app.repositories.signerComplianceVerificationItem, 'forge', sinon.fake.returns({ save: () => ({ id: 'fake-signerComplianceVerificationItemId' }) }))
      const fakeForgeForVerificationListEntry = sinon.replace(app.repositories.signerComplianceVerificationListEntry, 'forge', sinon.fake.returns({ save: () => true }))
      sinon.replace(app.repositories.signer, 'forge', sinon.fake.returns({ save: () => true }))

      // call target
      await app.services.compliance.verify(fakeUser.id)

      expect(fakeForgeForVerification).to.have.been.called
      expect(fakeForgeForVerificationItem.callCount).to.equal(2)
      expect(fakeForgeForVerificationListEntry.callCount).to.equal(226)

      const lastItem = fakeForgeForVerificationItem.lastCall.firstArg
      const lastEntry = fakeForgeForVerificationListEntry.lastCall.firstArg

      expect(lastItem.signerComplianceVerificationId).to.equal('fake-signerComplianceVerificationId')
      expect(lastEntry.signerComplianceVerificationItemId).to.equal('fake-signerComplianceVerificationItemId')
    })

    it('should try to update signer with verification status', async () => {
      sinon.replace(app.services.signer, 'get', sinon.fake.returns(fakeUser))
      sinon.replace(app.services.compliance, 'search', sinon.fake.returns({ search: {}, result: { id: 123 }, hits: [] }))
      sinon.replace(app.services.compliance, 'export', sinon.fake.returns({ id: '00000000-0000-0000-0000-000000000000' }))
      sinon.replace(app.services.compliance, 'parse', sinon.fake.returns(mocks.parsedResult))

      sinon.replace(app.repositories.signerComplianceVerification, 'forge', sinon.fake.returns({ save: () => ({ id: 'fake-signerComplianceVerificationId' }) }))
      sinon.replace(app.repositories.signerComplianceVerificationItem, 'forge', sinon.fake.returns({ save: () => ({ id: 'fake-signerComplianceVerificationItemId' }) }))
      sinon.replace(app.repositories.signerComplianceVerificationListEntry, 'forge', sinon.fake.returns({ save: () => true }))

      const fakeSaveForSigner = sinon.fake.returns(1)
      const fakeForgeForSigner = sinon.replace(app.repositories.signer, 'forge', sinon.fake.returns({ save: fakeSaveForSigner }))

      // call target
      await app.services.compliance.verify(fakeUser.id)

      expect(fakeForgeForSigner).to.have.been.called
      expect(fakeForgeForSigner.callCount).to.equal(3)
      expect(fakeForgeForSigner).to.have.been.calledWith({ id: fakeUser.id })

      expect(fakeSaveForSigner.getCall(0).args[0]).to.have.ownProperty('verificationStatusSanctions')
      expect(fakeSaveForSigner.getCall(1).args[0]).to.have.ownProperty('verificationStatusMedia')
      expect(fakeSaveForSigner.getCall(2).args[0]).to.have.ownProperty('verificationStatusPoliticalExposure')

      expect(fakeSaveForSigner.getCall(0).args[0].verificationStatusSanctions).to.equal('MATCH')
      expect(fakeSaveForSigner.getCall(1).args[0].verificationStatusMedia).to.equal('MATCH')
      expect(fakeSaveForSigner.getCall(2).args[0].verificationStatusPoliticalExposure).to.equal('MATCH')
    })

  })
})