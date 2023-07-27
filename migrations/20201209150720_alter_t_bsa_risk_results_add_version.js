
exports.up = function (knex) {
  const addNullConstraintSQL = "ALTER TABLE bsa_risk_results ALTER COLUMN version SET NOT NULL;"
  const updateRAWSQL = "UPDATE bsa_risk_results SET version='1' where version IS NULL;"

  return knex.schema.alterTable('bsa_risk_results', function (table) {
    table.string('version')
  })
    .then(() => knex.raw(updateRAWSQL))
    .then(() => knex.raw(addNullConstraintSQL))
}

exports.down = function (knex) {
  return knex.schema.alterTable('bsa_risk_results', function (table) {
    table.dropColumn('version')
  })
};
