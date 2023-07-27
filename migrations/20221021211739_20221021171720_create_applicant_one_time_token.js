exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('applicant_one_time_token', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()
    table.string('phone').notNullable()
    table.string('hashed_verification_token').notNullable()
    table.string('salt').notNullable()
    table.bigint('expiration').notNullable()
    table.boolean('is_already_used').notNullable()

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('applicant_one_time_token')
};
