
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('institution_branches', table => {
    table.string('routing_number').nullable()
    table.string('street').nullable()
    table.string('street_2').nullable()
    table.string('city').nullable()
    table.string('state').nullable()
    table.string('zip').nullable()
    table.boolean('active').default(true)
    table.string('note').nullable()
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('institution_branches', table => {
    table.dropColumn('routing_number')
    table.dropColumn('street')
    table.dropColumn('street_2')
    table.dropColumn('city')
    table.dropColumn('state')
    table.dropColumn('zip')
    table.dropColumn('active')
    table.dropColumn('note')
  })
};
