exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('account_requests', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()
    table.uuid('institution_id').references('institutions.id')
      .onDelete('CASCADE').notNullable()
    table.enu('status', ['PENDING', 'DECLINED', 'APPROVED'], {useNative:false, enumName:'account_request_status_type'})
      .defaultTo('PENDING').notNullable()

    table.uuid('status_updated_by_id').references('users.id')
    table.timestamp('status_updated_at')
    table.string('status_email_subject')
    table.text('status_email_body')

    table.string('contract_document_envelope_id')
    table.timestamp('contract_document_created_at')
    table.string('contract_document_envelope_status')
    table.timestamp('contract_document_envelope_status_updated_at')

    table.uuid('contract_document_id').references('id').inTable('documents')

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable('account_requests')

}
