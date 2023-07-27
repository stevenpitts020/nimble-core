exports.up = function (knex, Promise) {
  return knex.schema.createTableIfNotExists('signer_compliance_verification_items', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()

    table.string('full_name').notNullable()
    table.string('name_aka')
    table.date('date_of_birth')
    table.date('date_of_death')
    table.string('countries')
    table.string('associates')
    table.string('match_types')
    table
      .uuid('signer_compliance_verification_id')
      .references('signer_compliance_verifications.id')
      .notNullable()
      .onDelete('CASCADE')

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('signer_compliance_verification_items')
}
