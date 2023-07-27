exports.up = function (knex) {
  const sql = 'ALTER TABLE account_requests DROP CONSTRAINT account_requests_status_check;'

  return knex.schema.raw(sql).then(() => knex.schema.alterTable('account_requests', function (table) {
    table.enu('status', [
      'DRAFT',
      'INCOMPLETE',
      'PENDING',
      'SIGNED',
      'APPROVED',
      'DECLINED'
    ], { useNative: false, enumName: 'account_request_status_type' }).alter()
  }).toSQL())
}

exports.down = function (knex) {
  const sql = 'ALTER TABLE account_requests DROP CONSTRAINT account_requests_status_check;'

  return knex.schema.raw(sql).then(() => knex.schema.alterTable('account_requests', function (table) {
    table.enu('status', [
      'INCOMPLETE',
      'PENDING',
      'SIGNED',
      'APPROVED',
      'DECLINED'
    ], { useNative: false, enumName: 'account_request_status_type' }).alter()
  }).toSQL())
}
