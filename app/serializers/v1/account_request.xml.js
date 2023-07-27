const app = require('../../core')
const moment = require('moment')
const _ = require('lodash')



const BSAQuestions = {
  "usCitizen": "Are all account owners US citizens?",
  "countryOfOrigin": "What is your country of origin?",
  "hearAbout": "How did you hear about Central Bank?",
  "individualIncome": "Is your individual income greater than $35,000?",
  "householdIncome": "Is your household income greater than $50,000?",
  "milesAway": "Does at least one account owner live within 50 miles of Central Bank office?",
  "anotherBank": "Will you maintain a checking account at another bank?",
  "otherBankName": "What is the name of the bank?",
  "wireTransfersDomestic": "Do you anticipate 2 or more domestic wire transfers per month?",
  "wireTransfersInternational": "Do you anticipate 1 or more international wire transfers per month?",
  "cashTransactions": "Do you expect cash transactions in excess of $2,500 per month?",
  "atmDeposit": "Will the following products be used: ATM Deposit", // deprecated question in version 2
  "mobileDeposit": "Will the following products be used: Mobile Deposit", // deprecated question in version 2
  "directDeposit": "Will the following products be used: Direct Deposit", // deprecated question in version 2
  "mobileOrATMDeposit": "Are you planning on using Mobile or ATM Deposits?"
}

function serializer(data) {
  const tag = app.plugins.xml.tag
  const format = app.plugins.xml.format

  return format(tag('accountRequest', {
      updatedAt: moment(data.statusUpdatedAt).format('YYYY-MM-DDTHH:MM:SS'),
      updatedBy: data.statusUpdatedBy.email,
      branchCode: data.branch.externalId
    }, [
    tag('id', {}, data.id),
    tag('documents', {
      signedAt: moment(data.contractDocumentEnvelopeStatusUpdatedAt).format('YYYY-MM-DDTHH:MM:SS')
    },  _.get(data, 'documents', []).map(document => {
      return tag('document', { name: document.name, location: document.location })
    })),
    tag('bsa', {}, [
      tag('score', {}, data.bsaScore.toString()),
      tag('questions', {}, data.bsa.map(question => tag('question', {
          id: question.questionId,
          text: BSAQuestions[question.questionId]
        },
        question.answer
      )))
    ]),
    tag('signers', {}, data.signers.map(signer => {
      let documents
      if (signer.documentType === 'PASSPORT') {
        documents = [
          tag('document', {name: 'passport', location: signer.frontIdProofDocumentUri })
        ]
      } else {
        documents = [
          tag('document', {name: 'frontDocument', location: signer.frontIdProofDocumentUri }),
          tag('document', {name: 'backDocument', location: signer.backIdProofDocumentUri })
        ]
      }
      if (signer.creditReportUri) {
        documents.push(tag('document', {name: 'creditReport', location: signer.creditReportUri }))
      }
      if (signer.complianceReportUri) {
        documents.push(tag('document', {name: 'complianceReport', location: signer.complianceReportUri }))
      }

      return tag('signer', {}, [
        tag('id', {}, signer.id),
        tag('dateOfBirth', {}, moment(signer.dateOfBirth).format('YYYY-MM-DD')),
        tag('email', {}, signer.email),
        tag('firstName', {}, signer.firstName),
        tag('middleName', {}, signer.middleName),
        tag('lastName', {}, signer.lastName),
        tag('phoneNumber', {}, signer.phoneNumber),
        tag('ssn', {}, signer.ssn),
        tag('role', {}, signer.role),
        tag('employer', {}, signer.employer),
        tag('address', {}, [
          tag('street', {}, signer.address),
          tag('city', {}, signer.city),
          tag('state', {}, signer.state),
          tag('zipCode', {}, signer.zipCode),
        ]),
        tag('proof', { documentType: signer.documentType }, [
          tag(signer.documentType.toLowerCase(), {}, [
            tag('number', {}, signer.documentNumber),
            tag('expirationDate', {}, moment(signer.documentExpirationDate).format('YYYY-MM-DD')),
            tag('issuedDate', {}, moment(signer.documentIssuedDate).format('YYYY-MM-DD')),
            tag(signer.documentType === 'USDL' ? 'issuedState' : 'issuer', {}, signer.documentIssuer),
            tag('documents', {}, documents)
          ])
        ])
      ])
    })),
    tag('productConfigurations', {}, data.productConfigurations.map(pConfig => {
      let productOptionsArray = [
        tag('productOption', {
          category: 'product_config', key: 'initial_deposit', value: pConfig.initialDeposit
        })
      ]

      pConfig.product.options.map(poConfig => {
        let category =  poConfig.category
        if (poConfig.key === 'account_number') {
          category = 'product_config'
        }

        productOptionsArray.push(
          tag('productOption', {
            category: category,
            key: poConfig.key,
            value: poConfig.value
          })
        )
      })

      return tag('productConfiguration', { product_sku: pConfig.product.sku }, productOptionsArray)
    }))
  ]))
}

module.exports = serializer
