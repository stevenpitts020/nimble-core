exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('applications', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()
    table.uuid('applicant_id').references('users.id')
      .onDelete('CASCADE').notNullable()
    table.enu('status', ['PENDING', 'DECLINED', 'APPROVED'], {useNative:false, enumName:'account_request_status_type'})
      .defaultTo('PENDING').notNullable()
    table.string("session").notNullable()

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable('applications')
}
