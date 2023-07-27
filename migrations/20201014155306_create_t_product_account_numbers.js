
exports.up = function (knex) {
  return knex.schema.createTableIfNotExists('product_account_numbers', table => {
    table.string('account_number').notNullable()
    table.uuid('institution_id').nullable() // no reference or "ON DELETE CASCADE"
    table.uuid('account_request_id').nullable() // no reference or "ON DELETE CASCADE"

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())

    table.index('institution_id')
    table.index('account_request_id')
    table.index('account_number')
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('product_account_numbers')
}
