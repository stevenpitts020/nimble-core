exports.up = function (knex, Promise) {
  return knex.schema.createTableIfNotExists('account_request_products', table => {
    table.uuid('account_request_id').references('account_requests.id').notNullable().onDelete('CASCADE')
    table.uuid('product_id').references('products.id').notNullable().onDelete('CASCADE')

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())

    table.index('account_request_id')
    table.primary(['account_request_id', 'product_id'])
  })
}

exports.down = function (knex, Promise) {
  knex.schema.table('account_request_products', table => {
    table.dropIndex('account_request_id')
    table.dropPrimary(['account_request_id', 'product_id'])
  })
  return knex.schema.dropTable('account_request_products')
}
