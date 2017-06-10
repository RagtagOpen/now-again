const argv = require('minimist')(process.argv.slice(2))
const deploy = require('./deploy')

const jobName = argv._[0]
const input = argv.input

console.log(`Running ${jobName} with input ${input}`)

deploy(jobName, input)
