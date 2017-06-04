const querystring = require('querystring')
const { json, send } = require('micro')
const deploy = require('./deploy')
const humanizeDuration = require('humanize-duration')
const rp = require('request-promise-native')

module.exports = async (req, res) => {
  try {
    let [path, qs] = req.url.split('?')
    let job, input, webhook
    if (qs) {
      qs = querystring.parse(qs)
      job = qs.job
      input = qs.input
      webhook = qs.webhook
    } else {
      const body = await json(req)
      job = body.job
      input = body.input
      webhook = body.webhook
    }
    res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"})
    const startTime = new Date()
    res.write(JSON.stringify({ date: startTime.toISOString(), type: 'start', text: 'starting job'})+'\n')
    const result = await deploy(job, input, (logLine) => {
      // console.log("server saw:", logLine)
      const { type, text, date } = logLine
      res.write(JSON.stringify({ date, type, text })+'\n')
    })
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
    res.write(JSON.stringify(resultLog))
    if (webhook) {
      const webhookResult = await rp({
        uri: webhook,
        method: 'POST',
        body: resultLog,
        json: true
      })
      // console.log("webhook payload:", resultLog)
      console.log("webhook result:", webhookResult)
    }
    res.end()
  } catch (err) {
    console.log(err.stack)
    res.write(JSON.stringify({ date: new Date().toISOString, type: 'error', text: err.message })+'\n')
    res.end()
  }
}