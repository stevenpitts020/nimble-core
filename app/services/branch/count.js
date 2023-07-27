const app = require('../../core')
const InstitutionBranch = app.repositories.institutionBranch

async function count(filters = {}, tx = app.db) {
  const count = await InstitutionBranch.query(sql => {
    if (filters.institutionId) sql.where('institution_branches.institution_id', filters.institutionId)
    if (filters.search) sql.where(function() {
      const where = this
      filters.search.split(' ').forEach(term => where.orWhere('institution_branches.name', 'ILIKE', `${term}%`))
    })
  }).count({ transacting: tx })

  return { count }
}

module.exports = count
