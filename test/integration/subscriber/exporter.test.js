const sinon = require('sinon')
const { Consumer } = require('sqs-consumer')

const fs = require('fs')
const path = require("path")
const mockAccountRequestXml = fs.readFileSync(path.resolve(__dirname, '../../support/mock/xml/account_request_approved_event.xml')).toString()
const mockAccountRequestPassportXml = fs.readFileSync(path.resolve(__dirname, '../../support/mock/xml/account_request_passport_approved_event.xml')).toString()
const blueSquare = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkSP/0HwAEIgJaKSK+YQAAAABJRU5ErkJggg=='

function message(msg) {
  return { Message: JSON.stringify({ Body: JSON.stringify(msg) }) }
}

describe('app.services.subscriber.exporter', () => {
  beforeEach(() => {
    sinon.useFakeTimers({ toFake: ['Date'] })
    sinon.replace(app.plugins, 'uuid', () => {
      return '10203040-1010-1010-1010-050607080900'
    })
  })
  afterEach(() => sinon.restore())

  it('should exist', () => {
    expect(app.services.subscriber.exporter).not.to.be.undefined
    expect(app.services.subscriber.exporter).to.be.an('function')
  })

  it('should return a message queue Consumer', () => {
    const target = app.services.subscriber.exporter()

    expect(target).to.be.an('object')
    expect(target).to.be.instanceOf(Consumer)
    expect(target).to.have.ownProperty('handleMessage')
    expect(target.handleMessage).to.be.an('function')
  })

  describe('.handleMessage()', () => {
    it('should call app.services.accountRequest.export with message.id', async () => {
      const fakeService = sinon.replace(app.services.accountRequest, 'export', sinon.fake())

      const target = app.services.subscriber.exporter()

      await target.handleMessage(message({ id: '3ae6ab8c-5ea3-446e-a1a7-64dcd6cab990' }))

      expect(fakeService).to.have.been.calledOnce
      expect(fakeService).to.have.been.calledWith('3ae6ab8c-5ea3-446e-a1a7-64dcd6cab990')
    })

    describe('when receiving a message', () => {
      beforeEach(async () => {
        await seed.institution.create('11000000-0000-0000-0000-000000005555')
        await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000050')
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d360')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d360')
        await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d360')
        await seed.productOption.create('3552ab85-08da-4bb5-be00-9e94d282d360')

        await seed.accountRequest.create('da31cf6d-f10c-43a1-a67e-e80ad124c223')
        await seed.accountRequestProduct.create('da31cf6d-f10c-43a1-a67e-e80ad124c223')
        await seed.accountRequestProductOption.create('da31cf6d-f10c-43a1-a67e-e80ad124c223')

        await seed.bsaRiskResult.create('00000000-0000-0000-1111-000000000001')
        await seed.bsaRiskResult.create('00000000-0000-0000-1111-000000000002')
        await seed.bsaRiskResult.create('00000000-0000-0000-1111-000000000003')

        await seed.document.create('0ca05e4f-e97f-41e5-83f9-2d4bd0b98ff3')
        await seed.document.create('2f02077a-7636-4eb8-bad7-6635998de075')
        await seed.document.create('47939285-7fa7-43ee-8dfa-ac7967be4bef')
        await seed.document.create('2e31d8c0-1226-4651-8a5d-4bd8aa454724')
        await seed.document.create('2e31d8c0-1226-4651-8a5d-4bd8aa454725')
        await seed.signer.create('cc44aa1f-0000-0000-0000-000000000001')

        await seed.signerCreditReport.create('2e31d8c0-1226-4651-8a5d-4bd8aa454723')
        await seed.signerComplianceVerification.create('2e31d8c0-1226-4651-8a5d-4bd8aa454723')
        // source document images
        await app.plugins.aws.s3ImgUpload(blueSquare, '11000000-0000-0000-0000-000000005555', '0ca05e4f-e97f-41e5-83f9-2d4bd0b98ff3')
        await app.plugins.aws.s3ImgUpload(blueSquare, '11000000-0000-0000-0000-000000005555', '2f02077a-7636-4eb8-bad7-6635998de075')
        await app.plugins.aws.s3ImgUpload(blueSquare, '11000000-0000-0000-0000-000000005555', '47939285-7fa7-43ee-8dfa-ac7967be4bef')
        await app.plugins.aws.s3ImgUpload(blueSquare, '11000000-0000-0000-0000-000000005555', '2e31d8c0-1226-4651-8a5d-4bd8aa454724')
      })

      afterEach(() => sinon.reset())
      after(() => sinon.restore())

      it('should export account request info', async () => {
        sinon.replace(app.plugins.docusign, 'getEnvelopeFileContents', () => [])
        const target = app.services.subscriber.exporter()


        await target.handleMessage(message({ id: 'da31cf6d-f10c-43a1-a67e-e80ad124c223' }))
      })

      it('should try to upload the account request xml document', async () => {
        const fakeUploader = sinon.replace(app.plugins.aws, 's3SaveToFTP', sinon.fake())
        sinon.replace(app.plugins.docusign, 'getEnvelopeFileContents', () => {
          return [
            { file: Buffer.from('AAA'), filename: 'someFileName' },
            { file: Buffer.from('AAA'), filename: 'anotherFileName' },
            { file: Buffer.from('AAA'), filename: 'thirdFileName' },
          ]
        })
        const target = app.services.subscriber.exporter()

        await target.handleMessage(message({ id: 'da31cf6d-f10c-43a1-a67e-e80ad124c223' }))

        expect(fakeUploader.callCount).to.equal(4)
        expect(fakeUploader).to.have.been.calledWith(
          '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900.xml',
          Buffer.from(mockAccountRequestXml, 'utf-8'),
          { ContentType: "text/xml" }
        )
      })

      it('should try to upload the account request signer document images', async () => {
        const fakeCopy = sinon.replace(app.plugins.aws, 's3CopyToFTP', sinon.fake())
        sinon.replace(app.plugins.docusign, 'getEnvelopeFileContents', () => {
          return [
            { file: Buffer.from('AAA'), filename: 'someFileName' },
            { file: Buffer.from('AAA'), filename: 'anotherFileName' },
            { file: Buffer.from('AAA'), filename: 'thirdFileName' },
          ]
        })
        const target = app.services.subscriber.exporter()

        await target.handleMessage(message({ id: 'da31cf6d-f10c-43a1-a67e-e80ad124c223' }))

        expect(fakeCopy.callCount).to.equal(4)
        expect(fakeCopy).to.have.been.calledWith(
          '0ca05e4f-e97f-41e5-83f9-2d4bd0b98ff3.png',
          '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900/0ca05e4f-e97f-41e5-83f9-2d4bd0b98ff3.png',
        )
        expect(fakeCopy).to.have.been.calledWith(
          '2f02077a-7636-4eb8-bad7-6635998de075.png',
          '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900/2f02077a-7636-4eb8-bad7-6635998de075.png',
        )
      })

      it('should try to upload the account request signer credit report document', async () => {
        const fakeCopy = sinon.replace(app.plugins.aws, 's3CopyToFTP', sinon.fake())
        sinon.replace(app.plugins.docusign, 'getEnvelopeFileContents', () => {
          return [
            { file: Buffer.from('AAA'), filename: 'someFileName' },
            { file: Buffer.from('AAA'), filename: 'anotherFileName' },
            { file: Buffer.from('AAA'), filename: 'thirdFileName' },
          ]
        })
        const target = app.services.subscriber.exporter()

        await target.handleMessage(message({ id: 'da31cf6d-f10c-43a1-a67e-e80ad124c223' }))

        expect(fakeCopy.callCount).to.equal(4)
        expect(fakeCopy).to.have.been.calledWith(
          '2e31d8c0-1226-4651-8a5d-4bd8aa454724.pdf',
          '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900/2e31d8c0-1226-4651-8a5d-4bd8aa454724.pdf',
        )
      })

      it('should try to upload the account request signer compliance report document', async () => {
        const fakeCopy = sinon.replace(app.plugins.aws, 's3CopyToFTP', sinon.fake())
        sinon.replace(app.plugins.docusign, 'getEnvelopeFileContents', () => {
          return [
            { file: Buffer.from('AAA'), filename: 'someFileName' },
            { file: Buffer.from('AAA'), filename: 'anotherFileName' },
            { file: Buffer.from('AAA'), filename: 'thirdFileName' },
          ]
        })
        const target = app.services.subscriber.exporter()

        await target.handleMessage(message({ id: 'da31cf6d-f10c-43a1-a67e-e80ad124c223' }))

        expect(fakeCopy.callCount).to.equal(4)
        expect(fakeCopy).to.have.been.calledWith(
          '2e31d8c0-1226-4651-8a5d-4bd8aa454725.pdf',
          '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900/2e31d8c0-1226-4651-8a5d-4bd8aa454725.pdf',
        )
      })

      it('should try to upload multipple account request pdf documents', async () => {
        const fakePdfUploader = sinon.replace(app.plugins.aws, 's3SaveToFTP', sinon.fake())
        sinon.replace(app.plugins.docusign, 'getEnvelopeFileContents', () => {
          return [
            { file: Buffer.from('AAA'), filename: 'someFileName' },
            { file: Buffer.from('BBB'), filename: 'anotherFileName' },
            { file: Buffer.from('CCC'), filename: 'thirdFileName' },
          ]
        })
        const target = app.services.subscriber.exporter()

        await target.handleMessage(message({ id: 'da31cf6d-f10c-43a1-a67e-e80ad124c223' }))

        expect(fakePdfUploader.callCount).to.equal(4) // 4 calls, 3 for files, 1 for xml
        expect(fakePdfUploader).to.have.been.calledWith(
          '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900/EXPRT000.someFileName.pdf',
          Buffer.from('AAA'),
          { ContentType: "application/pdf" },
        )
        expect(fakePdfUploader).to.have.been.calledWith(
          '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900/EXPRT000.anotherFileName.pdf',
          Buffer.from('BBB'),
          { ContentType: "application/pdf" },
        )
        expect(fakePdfUploader).to.have.been.calledWith(
          '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900/EXPRT000.thirdFileName.pdf',
          Buffer.from('CCC'),
          { ContentType: "application/pdf" },
        )
      })

      describe('when the credit report document does not exists', () => {
        it('should not try to upload the account request signer credit report document', async () => {
          await knex.raw("DELETE FROM documents WHERE id='2e31d8c0-1226-4651-8a5d-4bd8aa454724'")
          await knex.raw("UPDATE signer_credit_reports SET document_id=null WHERE id='2e31d8c0-1226-4651-8a5d-4bd8aa454723'")
          await seed.signerCreditReport.create('2e31d8c0-1226-4651-8a5d-4bd8aa454723')

          const fakeCopy = sinon.replace(app.plugins.aws, 's3CopyToFTP', sinon.fake())
          sinon.replace(app.plugins.docusign, 'getEnvelopeFileContents', () => {
            return [
              { file: Buffer.from('AAA'), filename: 'someFileName' },
              { file: Buffer.from('AAA'), filename: 'anotherFileName' },
              { file: Buffer.from('AAA'), filename: 'thirdFileName' },
            ]
          })
          const target = app.services.subscriber.exporter()

          await target.handleMessage(message({ id: 'da31cf6d-f10c-43a1-a67e-e80ad124c223' }))

          expect(fakeCopy).to.have.been.calledThrice
          expect(fakeCopy).to.have.not.been.calledWith(
            '2e31d8c0-1226-4651-8a5d-4bd8aa454724.pdf',
            '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900/2e31d8c0-1226-4651-8a5d-4bd8aa454724.pdf',
          )
        })
      })

      describe('when the user has document type passport', () => {
        beforeEach(async () => {
          await knex.raw(`
            UPDATE signers
            SET document_type='PASSPORT', document_issuer='USA', back_id_proof_document_id=null
            where id='cc44aa1f-0000-0000-0000-000000000001'`
          )
        })

        it('should export account request info', async () => {
          sinon.replace(app.plugins.docusign, 'getEnvelopeFileContents', () => [])
          const target = app.services.subscriber.exporter()


          await target.handleMessage(message({ id: 'da31cf6d-f10c-43a1-a67e-e80ad124c223' }))
        })

        it('should try to upload the account request xml document', async () => {
          const fakeUploader = sinon.replace(app.plugins.aws, 's3SaveToFTP', sinon.fake())
          sinon.replace(app.plugins.docusign, 'getEnvelopeFileContents', () => {
            return [
              { file: Buffer.from('AAA'), filename: 'someFileName' },
              { file: Buffer.from('AAA'), filename: 'anotherFileName' },
              { file: Buffer.from('AAA'), filename: 'thirdFileName' },
            ]
          })
          const target = app.services.subscriber.exporter()

          await target.handleMessage(message({ id: 'da31cf6d-f10c-43a1-a67e-e80ad124c223' }))

          expect(fakeUploader.callCount).to.equal(4)
          expect(fakeUploader).to.have.been.calledWith(
            '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900.xml',
            Buffer.from(mockAccountRequestPassportXml, 'utf-8'),
            { ContentType: "text/xml" }
          )
        })

        it('should try to upload the account request signer document single image', async () => {
          const fakeCopy = sinon.replace(app.plugins.aws, 's3CopyToFTP', sinon.fake())
          sinon.replace(app.plugins.docusign, 'getEnvelopeFileContents', () => {
            return [
              { file: Buffer.from('AAA'), filename: 'someFileName' },
              { file: Buffer.from('AAA'), filename: 'anotherFileName' },
              { file: Buffer.from('AAA'), filename: 'thirdFileName' },
            ]
          })
          const target = app.services.subscriber.exporter()

          await target.handleMessage(message({ id: 'da31cf6d-f10c-43a1-a67e-e80ad124c223' }))

          expect(fakeCopy.callCount).to.equal(3)
          expect(fakeCopy).to.have.been.calledWith(
            '0ca05e4f-e97f-41e5-83f9-2d4bd0b98ff3.png',
            '11000000-0000-0000-0000-000000005555/requests/10203040-1010-1010-1010-050607080900/0ca05e4f-e97f-41e5-83f9-2d4bd0b98ff3.png',
          )
        })
      })
    })
  })
})
