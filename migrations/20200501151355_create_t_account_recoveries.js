exports.up = function (knex) {
  return knex.schema.createTableIfNotExists('account_recoveries', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()
    table.uuid('account_id').references('accounts.id')
      .notNullable().onDelete('CASCADE')
    table.string('code').notNullable()
    table.timestamp('expires_at').notNullable()
    table.timestamp('consumed_at').defaultTo(null)

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
};

exports.down = function (knex) {
  return knex.schema.dropTable('account_recoveries')
};
