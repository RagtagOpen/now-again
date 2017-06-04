const Now = require('./now-client')
const sleep = require('then-sleep')

const EOF_PREFIX = /EOF:/

const pollLogs = async function(uid, opts, onMessage, filterFn) {
  const now = new Now(opts.token)
  let logIds = []
  const read = async (since, filterFn) => {
    if (!since) since = new Date(0)
    const url = `/deployments/${uid}/logs?since=${since.getTime()}`
    // console.log(url)
    let lines = []
    const response = await now.get(url)
    response.logs.forEach(log => {
      if (logIds.includes(log.id)) return
      const logLines = log.text.match(EOF_PREFIX) ? [log.text.trim()] : log.text.trim().split('\n')
      logLines.forEach(line => {
        lines.push(Object.assign({}, log, { text: line }))
      })
      logIds.push(log.id)
    })
    if (lines.length > 0) since = new Date(lines[lines.length-1].date)
    if (filterFn) lines = lines.filter(filterFn)
    if (lines.length > 0) onMessage(lines)
    const lastLine = lines.find(line => line.text.match(/^EOF/) && line.type === 'stdout')
    if (lastLine) {
      if (lastLine.text.match(EOF_PREFIX)) {
        return lastLine.text.replace(EOF_PREFIX,'').trim()
      } else {
        return
      }
    } else {
      await sleep(1000)
      return read(since, filterFn)
    }
  }
  return read(0, filterFn)
}

module.exports = pollLogs