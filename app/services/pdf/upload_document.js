const config = require('../../../config')
const docusign = require('docusign-esign')
const fs = require('fs')

const { oauthPath, basePath, accountID } = config.get('docusign')

/**
 * This file contains functions to
 * 1) Create a docusign envelope and load it into a Buffer object
 * 2) Accept PDFs loaded into Buffer objects
 * 3) Package the envelope Buffer and PDF Buffers into a multipart form request
 * 4) Send the multipart form request to docusign via the docusign esign api
 *
 * Docusign will then create an envelope containing the PDF documents and email
 * a link to the envelope to the specified recipients. The recipients can click
 * the link in the email to access the documents to sign.
 *
 * More information on multipart Form Requests https://developers.docusign.com/esign-rest-api/guides/requests-and-responses
 *
 * TODO: Load docusign API client in a separate module and import the API client to make the API calls
 * TODO: Consider replacing manual request body creation with Multer (in a separate module) https://www.npmjs.com/package/multer, especially if/when a more general file uploading solution is needed
 */

// Buffer string constants
const CRLF = '\r\n'
const boundary = 'multipartboundary_multipartboundary'
const hyphens = '--'

const getAuthorizationHeader = async() => {
  const apiClient = new docusign.ApiClient()
  apiClient.setOAuthBasePath(oauthPath)
  const res = await apiClient.requestJWTUserToken(
    // These are the DocuSign credentials for the dev environment, which I needed to use for local testing, as
    // I was unable to find the DocuSign credentials for the local environment. We can update these to the
    // credentials for the local docusign app when we get access to the mb@nimblefi.com DocuSign account.
    // config.get('docusign').clientID,
    'ecd19816-cccc-467c-8b4a-52003de82777',
    // config.get('docusign').userID,
    '3e7e393d-3d4d-4c2a-af47-791d3ab7aba0',
    'signature impersonation',
    fs.readFileSync(config.get('docusign.privateKey')),
    900
  )
  return res.body.access_token
}

const createDocument = (name, fileExtension, documentId) => ({ name, fileExtension, documentId })

const createRecipient = (email, name, recipientId, routingOrder, signHereTabs) => ({
  email,
  name,
  recipientId,
  routingOrder,
  tabs: { signHereTabs }
})

const createSignHereTab = (anchorString, anchorXOffset, anchorYOffset, anchorUnits) => ({
  anchorString,
  anchorXOffset,
  anchorYOffset,
  anchorUnits
})

const createEnvelopeJson = (emailSubject, signers, carbonCopies, documents, status) => ({
  emailSubject,
  recipients: { signers, carbonCopies },
  documents,
  status
})

const createPdfRequestBodyParams = (document, documentBuffer) => ({
  mime: 'application/pdf',
  filename: document.name,
  documentId: document.documentId,
  bytes: documentBuffer
})

const createBufferBeginning = (envelopeJson) =>
  Buffer.from(
    `${hyphens}${boundary}${CRLF}` +
    `Content-Type: application/json${CRLF}` +
    `Content-Disposition: form-data${CRLF}${CRLF}` +
    JSON.stringify(envelopeJson, null, '    ')
  )

const createDocumentsBuffer = (documents) =>
  Buffer.concat(
    documents.map((document) =>
      Buffer.concat([
        Buffer.from(
          `${CRLF}${hyphens}${boundary}${CRLF}` +
          `Content-Type: ${document.mime}${CRLF}` +
          `Content-Disposition: filefilename="${document.filename}"documentId=${document.documentId}` +
          `${CRLF}${CRLF}`
        ),
        Buffer.from(document.bytes)
      ])
    )
  )

const createBufferEnd = () => Buffer.from(`${CRLF}${hyphens}${boundary}${hyphens}${CRLF}`)

const createRequestBody = (envelopeJson, documents) =>
  Buffer.concat([createBufferBeginning(envelopeJson), createDocumentsBuffer(documents), createBufferEnd()])

const createRequestOptions = (accessToken, requestBody) => ({
  url: `${basePath}/v2.1/accounts/${accountID}/envelopes`,
  method: 'post',
  headers: {
    Accept: 'application/json',
    'Content-Type': `multipart/form-data boundary=${boundary}`,
    Authorization: `Bearer ${accessToken}`
  },
  data: requestBody
})

module.exports = {
  docusignHelpers: {
    getAuthorizationHeader,
    createDocument,
    createRecipient,
    createSignHereTab,
    createEnvelopeJson,
    createPdfRequestBodyParams,
    createRequestBody,
    createRequestOptions
  }
}
