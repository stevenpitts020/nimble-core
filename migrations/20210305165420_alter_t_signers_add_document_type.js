
exports.up = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.string('document_type').notNullable().defaultsTo('USDL')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.dropColumn('document_type')
  })
};
