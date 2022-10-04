// NOT IN USE - REMAIN JUST FOR TESTING PRUPOSES

const { MongoClient } = require('mongodb')
const config = require('../config')
let client = null

module.exports = () => {
  if (!config.dbConnectionString) {
    console.error('get-mongo', 'missing CONNECTION')
    throw new Error('Missing CONNECTION')
  }

  console.log(`Getting data from '${config.dbConnectionString}'`)
  if (client !== null) {
    return client.db('E18').collection('statistics')
  }

  client = new MongoClient(config.dbConnectionString)
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
