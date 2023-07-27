const knexfile = require('../../knexfile')
const knex = require('knex')(knexfile)
const Bookshelf = require('bookshelf')(knex)

Bookshelf.plugin('bookshelf-camelcase')
Bookshelf.plugin('bookshelf-virtuals-plugin')
Bookshelf.plugin('bookshelf-eloquent')

module.exports = Bookshelf
