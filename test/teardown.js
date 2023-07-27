after(async() => {
  if (knex && _.isFunction(knex.destroy)) await knex.destroy()
})
