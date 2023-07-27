
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('users_mfa', table => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()
    table.string('email').notNullable()
    table.string('token').notNullable()
    table.timestamp('expires_at').notNullable()
    table.boolean('verified').defaultTo(false)
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users_mfa')
};
