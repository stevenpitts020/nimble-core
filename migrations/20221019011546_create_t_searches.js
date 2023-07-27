exports.up = (knex) => knex.schema.createTableIfNotExists('searches', table => {
  table.string('id').primary()
  table.uuid('institution_id').notNullable()
  table.string('name').notNullable()
  table.string('description').nullable()
  table.jsonb('query').notNullable()
  table.jsonb('filters').notNullable()
  table.uuid('created_by_id').notNullable()
  table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
})

exports.down = (knex) => knex.schema.dropTable('searches')
