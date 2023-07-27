const _ = require('lodash')
const app = require('../../core')
const moment = require('moment')
const logger = app.logger.getLogger('app.services.account_request.export')

async function copyDocument(documentId, institutionId, eventId){
  if (!documentId) {
    return null
  }
  // get document filename
  const source = await app.services.document.get({ id: documentId })
  const destination = `${eventId}/${source.key.replace(institutionId + '/', '')}`
  // copy document over
  try {
    await app.plugins.aws.s3CopyToFTP(
      `${source.key}`,
      `${institutionId}/requests/${destination}`
    )
  } catch (err) {
    logger.error(err, `[copyDocument] could not copy file from [/${source.key}] to [ftp:${institutionId}/${destination}]`)
  }

  return `/requests/${destination}`
}

async function processReports(reports, institutionId, eventId){
  if (!_.isEmpty(reports)) {
    // only get document if there is a document id
    if (reports[0].documentId) {
      return copyDocument(reports[0].documentId, institutionId, eventId)
    }
  }

  return
}

module.exports = async function exporter(accountRequestId, tx = app.db) {
  logger.info(`[exporter] called with [${accountRequestId}]`)

  // // main fetch
  const accountRequest = await app.services.accountRequest.get(accountRequestId, tx)

  const eventId = app.plugins.uuid()

  // BSA questions to be apendend to accountRequest
  const bsa = await app.services.bsaRiskResult.list({ accountRequestId }, tx)

  // copy PDF documents for every product
  const productSKUs = accountRequest.productConfigurations.map(c => c.product.sku)
  // push document definitions
  const documents = []
  for (const sku of productSKUs) {
    const envelope = await app.plugins.docusign.getEnvelopeFileContents(accountRequest.contractDocumentEnvelopeId, sku)
    if (envelope) {
      for (const pdf of envelope) {

        const filename = `${eventId}/${sku}.${pdf.filename}.pdf`

        // upload PDF file to FTP bucket
        await app.plugins.aws.s3SaveToFTP(
          `${accountRequest.institutionId}/requests/${filename}`, // key
          pdf.file, // buffer
          { ContentType: 'application/pdf' } // options
        )

        documents.push({
          location: `/requests/${filename}`,
          name: pdf.filename
        })
      }
    }
  }

  // copy signer documents
  for (const signer of accountRequest.signers) {
    for (const doc of ['frontIdProofDocumentId', 'backIdProofDocumentId']) {
      // copy signer document and get destination
      signer[doc.replace(new RegExp('Id'+'$'), 'Uri')] = await copyDocument(signer[doc], accountRequest.institutionId, eventId)
    }

    // get last credit report record and copy to s3
    const creditReportPayload = {
      signerId: signer.id,
      limit: 1,
      sort: '-updated_at'
    }
    const creditReports = await app.services.creditReport.list(creditReportPayload)
    signer.creditReportUri = await processReports(creditReports, accountRequest.institutionId, eventId)

    // get compliance report record and copy to s3
    const complianceReports = await app.services.complianceVerification.list(signer.id)
    signer.complianceReportUri = await processReports(complianceReports, accountRequest.institutionId, eventId)
  }

  // build final obj
  const data = {
    ...accountRequest,
    bsa,
    documents
  }

  // serialize XML
  const xmlFileContent = app.serializers.v1.eventXml({
    name: 'account_request_approved',
    rid: eventId,
    timestamp: moment().format('YYYY-MM-DDTHH:MM:SS'),
    data
  })

  // upload XMl file to FTP bucket
  try {
    await app.plugins.aws.s3SaveToFTP(
      `${accountRequest.institutionId}/requests/${eventId}.xml`, // key
      Buffer.from(xmlFileContent, 'utf-8'), // buffer
      { ContentType: 'text/xml' } // options
    )
  } catch (err) {
    logger.error(err, `[exporter] could not save xml file for ${accountRequestId}`)
    throw err
  }

  logger.info(`[exporter] ended for [${accountRequestId}]`)
}
