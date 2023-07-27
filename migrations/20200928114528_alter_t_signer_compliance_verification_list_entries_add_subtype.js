
exports.up = function (knex) {
  return knex.schema.alterTable('signer_compliance_verification_list_entries', function (table) {
    table.string('subtype')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('signer_compliance_verification_list_entries', function (table) {
    table.dropColumn('subtype')
  })
};
