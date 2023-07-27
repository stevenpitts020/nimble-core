exports.up = function (knex) {
  const sql = 'ALTER TABLE signers DROP CONSTRAINT signers_status_check;'

  return knex.schema.raw(sql).then(() => knex.schema.alterTable('signers', function (table) {
    table.enu('status', [
      'INVITED',
      'INCOMPLETE',
      'PENDING',
      'SIGNED'
    ], { useNative: false, enumName: 'signers_status_type' }).alter()
  }).toSQL())
}

exports.down = function (knex) {
  const sql = 'ALTER TABLE signers DROP CONSTRAINT signers_status_check;'

  return knex.schema.raw(sql).then(() => knex.schema.alterTable('signers', function (table) {
    table.enu('status', [
      'INVITED',
      'PENDING',
      'SIGNED'
    ], { useNative: false, enumName: 'signers_status_type' }).alter()
  }).toSQL())
}
