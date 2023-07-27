module.exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('users', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()
    table.uuid('institution_id').references('institutions.id')
      .notNullable().onDelete('CASCADE')
    table.string('email').notNullable()
    table.string('first_name')
    table.string('last_name')

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

module.exports.down = function(knex) {
  return knex.schema.dropTable('users')
}
