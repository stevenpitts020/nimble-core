
exports.up = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.dropColumn('identity_verification_status')
    table.dropColumn('identity_verified')
    table.dropColumn('identity_verification_result')
  })
};
exports.down = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.string('identity_verification_status')
    table.boolean('identity_verified')
    table.jsonb('identity_verification_result').default(null)
  })
};