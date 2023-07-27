const axios = require('axios')
const { loadPdf, fillPdf, savePdf } = require('./fill_pdf')
const { docusignHelpers } = require('./upload_document')
const { getPdfFormFields } = require('./pdf_form_fields.test')

const run = async () => {
	const formFields = getPdfFormFields()
	let pdfDocument1 = await loadPdf('/sample.pdf')
	pdfDocument1 = fillPdf(pdfDocument1, formFields)
	let pdfBytes1 = await savePdf(pdfDocument1)
	let pdfDocument2 = await loadPdf('/sample1.pdf')
	// pdfDocument2 = fillPdf(pdfDocument2, formFields)
	let pdfBytes2 = await savePdf(pdfDocument2)
	const signHereTab = docusignHelpers.createSignHereTab('/sn1/', '20', '10', 'pixels')
	const document1 = docusignHelpers.createDocument('sample.pdf', 'pdf', '1')
	const document2 = docusignHelpers.createDocument('sample1.pdf', 'pdf', '2')
	const signer = docusignHelpers.createRecipient('kknapp@zivaro.com', 'Kyle', '1', '1', [ signHereTab ])
	const envelopeJson = docusignHelpers.createEnvelopeJson(
		'Please sign the included document(s)',
		[ signer ],
		[],
		[ document1, document2 ],
		'sent'
	)
	const documents = [
		{
			mime: 'application/pdf',
			filename: 'sample.pdf',
			documentId: '1',
			bytes: pdfBytes1
		},
		{
			mime: 'application/pdf',
			filename: 'sample1.pdf',
			documentId: '2',
			bytes: pdfBytes2
		}
	]
	const requestBody = docusignHelpers.createRequestBody(envelopeJson, documents)
	const accessToken = await docusignHelpers.getAuthorizationHeader()
	const requestOptions = docusignHelpers.createRequestOptions(accessToken, requestBody)
	await axios(requestOptions)
}

module.exports = run
