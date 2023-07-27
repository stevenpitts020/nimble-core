const app = require('../../core')
const User = app.repositories.user

async function count(filters = {}, tx = app.db) {
  const count = await User.query(sql => {
    if (filters.branchId || filters.branch) sql.where('users.branch_id', filters.branchId || filters.branch)
    if (filters.institutionId) sql.where('users.institution_id', filters.institutionId)
    if (filters.search) sql.where(function() {
      const where = this
      filters.search.split(' ').forEach(term => where
        .orWhere('users.first_name', 'ILIKE', `${term}%`)
        .orWhere('users.last_name', 'ILIKE', `${term}%`)
        .orWhere('users.email', 'ILIKE', `${term}%`)
      )
    })
  }).count({ transacting: tx })

  return { count }
}

module.exports = count
