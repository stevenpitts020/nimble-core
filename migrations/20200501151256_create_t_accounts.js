module.exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('accounts', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()
    table.uuid('user_id').references('users.id')
      .notNullable().onDelete('CASCADE')
    table.string('strategy')
    table.string('secret')
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

module.exports.down = function(knex) {
  return knex.schema.dropTable('accounts')
}
