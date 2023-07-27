exports.up = function (knex) {
  return knex.schema.createTableIfNotExists('signers_identity_verifications', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()
    table
      .uuid('signer_id')
      .references('signers.id')
      .notNullable()
      .onDelete('CASCADE')

    table.string('verification').notNullable()
    table.enu('status', ['VALID', 'INVALID', 'PENDING'], { useNative: false, enumName: 'signers_identity_verifications_status' })
      .notNullable()
      .defaultTo('PENDING')

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('signers_identity_verifications')
}
