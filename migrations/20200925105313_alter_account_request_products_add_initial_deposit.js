
exports.up = function (knex) {
  return knex.schema.alterTable('account_request_products', function (table) {
    table.integer('initial_deposit').default(null)
  })
};
exports.down = function (knex) {
  return knex.schema.alterTable('account_request_products', function (table) {
    table.dropColumn('initial_deposit')
  })
};
