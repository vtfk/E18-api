// NOT IN USE - REMAIN JUST FOR TESTING PRUPOSES

const { MongoClient } = require('mongodb')
const config = require('../config')
config.dbConnectionString
let client = null

module.exports = () => {
  if (!config.dbConnectionString) {
    console.error('get-mongo', 'missing CONNECTION')
    throw new Error('Missing CONNECTION')
  }

  console.log(`Getting data from '${config.dbConnectionString}'`)
  if (client && !client.isConnected) {
    client = null
    console.warn('get-mongo', 'mongo connection lost', 'client discarded')
  }

  if (client === null) {
    client = new MongoClient(config.dbConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
  } else if (client.isConnected) {
    try {
      return new Promise(resolve => resolve(client.db('E18').collection('statistics')))
    } catch (error) {
      console.error('get-mongo', 'client was connected but failed', 'new client created', error)
      client = new MongoClient(config.dbConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
    }
  }

  return new Promise((resolve, reject) => {
    client.connect(error => {
      if (error) {
        client = null
        console.error('get-mongo', 'client connect error', error)
        return reject(error)
      }

      return resolve(client.db('E18').collection('statistics'))
    })
  })
}
