const request = require('request-promise-native')

class BambooPoller {
  constructor(config) {
    this._state = {}
    this._config = config
    // config:
    //   server
    //   buildKey
    //   maxResults
    //   username
    //   password
  }

  _callBamboo(url, method='GET', json=true) {
    const authorization = 'Basic ' + Buffer.from(this._config.username + ':' + this._config.password).toString('base64')
    const requestOptions = {
        url,
        method,
        json,
        headers: {
            authorization
        }
    }

    console.info(`Calling ${method} ${requestOptions.url} ...`)
    return request.get(requestOptions)
  }

  poll(onChange) {
    this._callBamboo(`${this._config.server}/rest/api/latest/result/${this._config.buildKey}.json?includeAllStates&max-result=${this._config.maxResults}`)
      .then(data => {
        let changed = {}

        data.results.result.forEach(result => {
          if ((result.state === 'Successful' || result.state === 'Failed') && this._state[result.key] !== result.state) {
            changed[result.key] = this._state[result.key] = result.state
          }
        })

        if (Object.keys(changed).length !== 0) {
          onChange(changed)
        } 
      })
      .catch(e => {
        console.error(e.message)
        //console.error(e)
      })
  }

  status(onChange) {
    onChange(this._state)
  }
}

module.exports = BambooPoller

