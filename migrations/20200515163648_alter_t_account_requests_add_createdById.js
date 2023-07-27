exports.up = function (knex) {
  return knex.schema.alterTable('account_requests', function (table) {
    table.uuid('created_by_id').nullable()

    // update existing rows
    const q = `SELECT a.id as account_request_id,
              (SELECT id 
                FROM signers 
                WHERE account_request_id = a.id 
            ORDER BY created_at ASC 
                LIMIT 1) as signer_id
          FROM account_requests a`

    return knex.raw(q).then(function (result) {
      return Promise.all(
        result.rows.map((row) => {
          return knex('account_requests').where('id', row.account_request_id).update('created_by_id', row.signer_id)
        })
      )
    })
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('account_requests', function (table) {
    table.dropColumn('created_by_id')
  })
}
