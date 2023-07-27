exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.uuid('branch_id').notNullable().alter()
  })
}

exports.down = function (knex) {
}
