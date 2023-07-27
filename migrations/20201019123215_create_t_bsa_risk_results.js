exports.up = function (knex) {
  return knex.schema.createTableIfNotExists('bsa_risk_results', table => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()
    table.uuid('institution_id').nullable() // no reference or "ON DELETE CASCADE"
    table.uuid('account_request_id').nullable() // no reference or "ON DELETE CASCADE"
    table.integer('position').notNullable()
    table.string('question_id').notNullable()
    table.string('answer').notNullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
    table.index('institution_id')
    table.index('account_request_id')
    table.index('position')
  })
}
exports.down = function (knex) {
  knex.schema.table('bsa_risk_results', table => {
    table.dropIndex('institution_id')
    table.dropIndex('account_request_id')
    table.dropIndex('position')
  })
  return knex.schema.dropTable('bsa_risk_results')
}
