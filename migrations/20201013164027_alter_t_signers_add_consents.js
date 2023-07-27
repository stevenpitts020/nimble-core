
exports.up = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.boolean('consent_account_opening')
    table.boolean('consent_privacy_policy')
    table.boolean('consent_communication')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.dropColumn('consent_account_opening')
    table.dropColumn('consent_privacy_policy')
    table.dropColumn('consent_communication')
  })
};
