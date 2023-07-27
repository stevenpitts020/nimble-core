exports.up = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.boolean('email_verified').default(false)
    table.timestamp('email_verified_at')
  })
};
exports.down = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.dropColumn('email_verified')
    table.dropColumn('email_verified_at')
  })
};
