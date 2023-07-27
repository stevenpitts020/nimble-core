const convict = require('convict')
const schema = require('./schema')

// Define a schema
var conf = convict(schema)

// Load environment dependent configuration for non-deployed environments
var env = conf.get('env')
if (['local', 'test', 'test-ci'].includes(env)) conf.loadFile('./config/' + (process.env.CI ? 'test-ci' : env) + '.json')

// Perform validation
conf.validate({allowed: 'strict'})

module.exports = conf
