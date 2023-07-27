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
      address_document_visibility: 0,
      match_address_proofs_with_document_proofs: 1,
      selected_type: 1,
      full_address: 0,
      address_document: 0,
      name: 0,
      address_document_proof: 0,
      address_document_must_not_be_expired: 0,
      address_document_country: 0
    },
    document: {
      issue_date: 1,
      document_visibility: 0,
      dob: 0,
      selected_type: 1,
      name: 0,
      document: 0,
      face_on_document_matched: 1,
      document_proof: 0,
      document_must_not_be_expired: 0,
      document_country: 0
    },
    face: 1
  },
  info: {},
  declined_reason: 'Document originality could not be verified',
  declined_codes: [
    'SPDR17',
    'SPDR06',
  ],
}