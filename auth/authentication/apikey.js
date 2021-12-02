/*
    Import dependencies
*/
const HeaderAPIKeyStrategy = require('passport-headerapikey').HeaderAPIKeyStrategy
const ApiKeys = require('../../database/db').ApiKeys
const crypto = require('crypto')

// function getEnvironmentAPIKeys () {
//   const APIKeys = []
//   let currentKey = 'initial'
//   let counter = 1
//   while (currentKey !== undefined) {
//     currentKey = process.env['APIKEY' + counter]
//     if (currentKey) { APIKeys.push(currentKey) } else { break }
//     counter++
//     if (counter === 1000) { break } // Protect against infinity loop
//   }
//   return APIKeys
// }

module.exports = new HeaderAPIKeyStrategy(
  {
    header: 'X-API-KEY'
  },
  false,
  async (apikey, done) => {
    console.log(apikey)
    const hash = crypto.createHash('sha512').update(apikey).digest('hex')
    const test = await ApiKeys.findOne({ hash: hash })
    if (!process.env.NODE_ENV === 'test') {
      if (test === null) {
        console.log('❌ No matching API Key could be found');
        return done(null)
      } else {
        // hashedApiKeyFromDB = test.hash
        return done(null, 'test')
      }
    } else {
      return done(null, 'test')
    }
  }
)
