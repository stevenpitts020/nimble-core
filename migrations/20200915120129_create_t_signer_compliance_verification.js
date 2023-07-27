exports.up = function (knex, Promise) {
  return knex.schema.createTableIfNotExists('signer_compliance_verifications', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()

    table.string('status').notNullable()
    table.jsonb('search_object').default(null)
    table.string('reference').notNullable()
    table
      .uuid('signer_id')
      .references('signers.id')
      .notNullable()
      .onDelete('CASCADE')

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('signer_compliance_verifications')
}
