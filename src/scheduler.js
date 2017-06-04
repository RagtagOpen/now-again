const glob = require('glob-promise')
const fs = require('mz/fs')
const cronParser = require('cron-parser')
const CronJob = require('cron').CronJob
const friendlyCron = require('friendly-cron')
const deploy = require('./deploy')
const humanizeDuration = require('humanize-duration')
const rp = require('request-promise-native')
const stringOrEnv = require('./string-or-env')

const loadSchedules = async (stuff) => {
  const configFiles = await glob('tasks/*/task.json')
  return await Promise.all(configFiles.map(async f => {
    const config = JSON.parse(await fs.readFile(f, 'utf8'))
    const name = f.split('/')[1]
    const pattern = friendlyCron(config.schedule) ? friendlyCron(config.schedule) : config.schedule
    const interval = cronParser.parseExpression(pattern)
    console.log(`
    ${name} will run at:
      ${interval.next().toString()},
      ${interval.next().toString()},
      ${interval.next().toString()},
      etc.
        `)
    return {
      name,
      schedule: config.schedule,
      pattern,
      input: stringOrEnv(config.input),
      webhook: stringOrEnv(config.webhook) }
  }))
}

const runJobs = (jobs) => {
  console.log("running jobs", jobs)
  jobs.forEach(job => {
    new CronJob(job.pattern, function() {
      // console.log("pretending to run", job.name)
      const startTime = new Date()
      deploy(job.name, job.input, (logLine) => {
        // console.log("server saw:", logLine)
        const { type, text, date } = logLine
        console.log(job.name, date, type, text)
      }).then(result => {
        if (job.webhook) {
          console.log("-- posting to webhook")
          const endTime = new Date()
          const duration = endTime.getTime() - startTime.getTime()
          const resultLog = {
            date: endTime.toISOString(),
            finished: true,
            type: 'result',
            text: result,
            duration: {
              ms: duration,
              friendly: humanizeDuration(duration)
            }
          }
          rp({
            uri: job.webhook,
            method: 'POST',
            body: resultLog,
            json: true
          }).then(console.log)
        }
      })

    }, null, true, 'Etc/UTC')
  })
}

const run = () => {
  loadSchedules().then(runJobs)
}

if (require.main === module) {
  run()
}

module.exports = run