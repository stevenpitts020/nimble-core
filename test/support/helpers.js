const app = require('../../app/core')
const logger = app.logger.getLogger('test.support.helpers')

module.exports = {
  tantrum: function(err) {
    if (err) throw err
  },
  getAuthToken: async function(id = '1052ab85-08da-4bb5-be00-9e94d282d310') {
    const user = blueprints.auth.get(id)
    return request(app.server)
      .post('/v1/auth/login')
      .send(_.pick(user, ['email', 'password']))
      .then(res => {
        return res.body.token
      })
  },
  getScopedAuthToken: async function(data, id = 'a74f9092-5889-430a-9c19-6712f9f68090') {
    const app = require('../../app/core')
    const jwt = app.plugins.jwt

    const now = moment()
    const defaults = {
      iss: 'https://api.nimble-fi.com',
      sub: 'https://api.nimble-fi.com/v1/users/10',
      aud: 'https://nimble-fi.com',
      exp: moment(now).add(10, 'm').unix(),
      iat: moment(now).unix(),
      // private claims
      resources: [`documents#${id}`],
      scopes: ['documents']
    }
    const payload = _.defaults({}, data, defaults)
    return jwt.encode(payload)
  },
  getExpiredAuthToken: async function() {
    return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJodHRwczovL2FwaS5uaW1ibGUtZmkuY29tIiwic3ViIjoiaHR0cHM6Ly9hcGkubmltYmxlLWZpLmNvbS92MS91c2Vycy9hYmNlZCIsImF1ZCI6Imh0dHBzOi8vbmltYmxlLWZpLmNvbSIsImV4cCI6MTU4NjgwNDA0MiwiaWF0IjoxNTg2ODA0MDQxLCJyZXNvdXJjZXMiOlsiZG9jdW1lbnQtYWJjZGUiXSwic2NvcGVzIjpbImRvY3VtZW50cyJdLCJhdCI6MTU4NjgwNDA0MTYyN30.R2MZvrcHsDem6IlNwLnXsIbTgx9CfRgrAqmZQpRvtW72MIeOfhSbONUpeH1GBtFyeJqvqZg2lAjNPmW8i4atRQ"
  },
  getInvalidAuthToken: async function() {
    return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJodHRwczovL2FwaS5uaW1ibGUtZmkuY29tIiwic3ViIjoiaHR0cHM6Ly9hcGkubmltYmxlLWZpLmNvbS92MS91c2Vycy9hYmNlZCIsImF1ZCI6Imh0dHBzOi8vbmltYmxlLWZpLmNvbSIsImV4cCI6MTU4NjgwNDA0MiwiaWF0IjoxNTg2ODA0MDQxLCJyZXNvdXJjZXMiOlsiZG9jdW1lbnQtYWJjZGUiXSwic2NvcGVzIjpbImRvY3VtZW50cyJdLCJhdCI6MTU4NjgwNDA0MTYyN30.R2MZvrcHsDem6IlNwLnXsIbTgx9CfRgrAqmZQpRvtW72MIeOfhSbONUpeH"
  },
  enableNock: function (options = {}) {
    nock.disableNetConnect()
    nock.emitter.on('no match', (request) => {
      logger.debug('Request fired that did not match what was mocked', [request.protocol, '://', request.host, request.path].join(""))
    })

    if (!options.s3) {
      nock.enableNetConnect(/^(127\.0\.0\.1|localhost:(?!4566))/)
    } else {
      nock.enableNetConnect(/^(127\.0\.0\.1|localhost|localstack)/)
    }
  }
}
