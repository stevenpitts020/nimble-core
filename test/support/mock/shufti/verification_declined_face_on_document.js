module.exports = {
  reference: '5674563147',
  event: 'verification.declined',
  email: 'john@wearesingular.com',
  country: 'US',
  verification_data: {
    document: {
      issue_date: '1990-01-01',
      selected_type: [
        'id_card',
      ],
      supported_types: [
        'id_card',
        'passport',
        'driving_license',
        'credit_or_debit_card',
      ],
    },
    address: {
      full_address: 'Candyland Avenue',
      selected_type: [
        'utility_bill',
      ],
      supported_types: [
        'utility_bill',
        'driving_license',
        'bank_statement',
        'envelope',
        'id_card',
        'passport',
        'rent_agreement',
        'employer_letter',
        'insurance_agreement',
        'tax_bill',
      ],
    },
    background_checks: {
      dob: '1990-01-01',
      name: {
        last_name: 'John',
        first_name: 'Doe',
      },
    },
  },
  verification_result: {
    address: {
      address_document_visibility: 1,
      match_address_proofs_with_document_proofs: 1,
      selected_type: 1,
      full_address: 1,
      address_document: 1,
      name: 1,
      address_document_proof: 1,
      address_document_must_not_be_expired: 1,
      address_document_country: 1
    },
    document: {
      issue_date: 1,
      document_visibility: 1,
      dob: 1,
      selected_type: 1,
      name: 1,
      document: 1,
      face_on_document_matched: 0,
      document_proof: 1,
      document_must_not_be_expired: 1,
      document_country: 1
    },
    face: 1
  },
  info: {},
  declined_reason: "Face on the document doesn't match with camera image",
  declined_codes: [
    "SPDR15",
  ]
}