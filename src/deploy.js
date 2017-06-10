const nowClient = require('now-client')
const loadProject = require('./load-project')
const pollLogs = require('./poll-logs')
const fs = require('mz/fs')
const Path = require('path')

const run = async (jobName, input, onMessage) => {

  const now = nowClient(process.env.AUTH_TOKEN)

  let cancel

  process.on('SIGINT', async () => {
    console.log("-- canceled, deleting deployment")
    if (typeof cancel === 'function') await cancel()
    process.exit()
  })

  const projectFiles = await loadProject(`tasks/${jobName}`)
  const log = (message) => {
    if (onMessage) onMessage({ type: 'status', text: message, date: new Date().toISOString()})
    else console.log(message)
  }
  if (!projectFiles['.env']) projectFiles['.env'] = ""
  if (input) {
    console.log("input:", input)
    projectFiles['.env'] += `\nINPUT=${JSON.stringify(input)}`
  }
  // if there's a task.json, respect the env mappings
  try {
    const taskOpts = JSON.parse(await fs.readFile(Path.join(process.cwd(), `./tasks/${jobName}/task.json`)))
    if (taskOpts.exposeEnv) {
      taskOpts.exposeEnv.forEach(envVarName => {
        projectFiles['.env'] += `\n${envVarName}=${process.env[envVarName]}`
      })
    }
  } catch (e) {
    console.log("error reading task.json, skipping", e)
  }
  // console.log("project files:", projectFiles)
  log("-- deploying")
  const deployment = await now.createDeployment(projectFiles)
  console.log("-- deployment info:", deployment)
  cancel = () => now.deleteDeployment(deployment.uid)

  try {
    log("-- polling for logs")

    const printLogs = (logs) => {
      console.log(logs.map(line => `${line.type}: ${line.text}`).join("\n"))
      if (onMessage) logs.map(onMessage)
    }

    const jobResult = await pollLogs(deployment.uid, {}, printLogs)
    console.log("-- result:", jobResult)
    console.log("-- deleting deployment")

    await now.deleteDeployment(deployment.uid)
    console.log("done!")

    try {
      return JSON.parse(jobResult)
    } catch (e) {
      return jobResult
    }
  } catch (runError) {
    await now.deleteDeployment(deployment.uid)
    throw runError
  }
}

module.exports = run
