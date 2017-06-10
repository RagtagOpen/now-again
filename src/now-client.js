const rp = require('request-promise-native')
const path = require('path')
const os = require('os')

class NowClient {
  constructor(token) {
    this.token = token
  }

  getToken() {
    if (!this.token) this.token = process.env.NOW_TOKEN

    if (!this.token) {
      try {
        const configPath = path.join(os.homedir(), '.now.json')
        this.token = require(configPath).token // eslint-disable-line global-require, import/no-dynamic-require
      } catch (err) {
        console.error(`Error: ${err}`)
      }
    }

    if (!this.token) throw new Error("Couldn't get token from NOW_TOKEN or ~/.now.json")

    return this.token
  }

  reqOpts(method, uri, body) {
    return {
      method: method,
      body: body,
      uri: `https://api.zeit.co/now${uri}`,
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      },
      json: true
    }
  }

  get(uri) {
    return rp(this.reqOpts('GET', uri))
  }

  createDeployment(body) {
    return rp(this.reqOpts('POST', '/deployments', body))
  }

  deleteDeployment(id) {
    return rp(this.reqOpts('DELETE', `/deployments/${id}`))
  }


}

module.exports = NowClient
