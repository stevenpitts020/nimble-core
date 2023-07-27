exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('signers', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()
    table.uuid('institution_id').references('institutions.id')
      .notNullable().onDelete('CASCADE')
    table.uuid('account_request_id').references('account_requests.id')
      .notNullable().onDelete('CASCADE')

    table.string('identity_verification_status')
    table.boolean('identity_verified')

    table.boolean('consent').notNullable()

    table.string('role').notNullable()

    table.string('first_name')
    table.string('middle_name')
    table.string('last_name')
    table.string('address')
    table.string('city')
    table.string('state')
    table.string('zip_code')
    table.date('date_of_birth')

    table.string('phone_number')
    table.string('ssn')
    table.string('email')

    table.string('step').notNullable()

    table.string('document_number')
    table.timestamp('document_issued_date')
    table.timestamp('document_expiration_date')

    table.jsonb('identity_verification_result').default(null)

    table.string('front_drivers_license_uri')
    table.string('back_drivers_license_uri')
    table.string('selfie_uri')

    table.uuid('selfie_document_id').references('id').inTable('documents')
    table.uuid('front_drivers_license_document_id').references('id').inTable('documents')
    table.uuid('back_drivers_license_document_id').references('id').inTable('documents')

    table.boolean('check_sanction')
    table.timestamp('sanction_verified_at')

    table.boolean('check_political_exposure')
    table.timestamp('political_exposure_verified_at')

    table.boolean('check_adverse_media')
    table.timestamp('adverse_media_verified_at')

    table.boolean('check_anti_money_laundering')
    table.timestamp('anti_money_laundering_verified_at')

    table.string('contract_document_signer_status')
    table.timestamp('contract_document_signer_status_updated_at')

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable('signers')

}
