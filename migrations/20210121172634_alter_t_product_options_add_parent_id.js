
exports.up = function (knex) {
  return knex.schema.alterTable('product_options', function (table) {
    table.string('lead').defaultsTo(null)
    table.string('annotation').defaultsTo(null)
    table.uuid('parent_id')
      .references('product_options.id')
      .onDelete('CASCADE')
      .defaultsTo(null)
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('product_options', function (table) {
    table.dropColumn('lead')
    table.dropColumn('annotation')
    table.dropColumn('parent_id')
  })
};
