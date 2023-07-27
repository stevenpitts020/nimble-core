exports.up = function(knex) {
  return knex.schema.alterTable('users', function (table) {
    table.integer('failed_login_attempts').notNullable().defaultsTo(0)
  })
}

exports.down = function(knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropColumn('failed_login_attempts')
  })
}
