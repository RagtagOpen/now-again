#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const deploy = require('./deploy')
const NowClient = require('./now-client')

const command = argv._[0]

switch (command) {
  case 'run':
    const jobName = argv._[1]
    const input = argv.input
    console.log(`Running ${jobName} with input ${input}`)
    deploy(jobName, input)
    break;
  case 'add-token-secret':
    const client = new NowClient()
    const token = client.getToken()
    client.addSecret('now-token', token)
      .then(() => console.log("added token secret as @now-token"))
      .catch(err => console.log("Error adding token:", err.message || err))
    break;

  default:

}
