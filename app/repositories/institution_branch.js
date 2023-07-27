const app = require('../core')

const InstitutionBranch = app.db.Model.extend({
  tableName: 'institution_branches',
  requireFetch: false,
  hasTimestamps: true,

  institution: function () {
    return this.belongsTo('Institution', 'institution_id')
  },

})

module.exports = app.db.model('InstitutionBranch', InstitutionBranch)
