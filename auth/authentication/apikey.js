/*
    Import dependencies
*/
const HeaderAPIKeyStrategy = require('passport-headerapikey').HeaderAPIKeyStrategy

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
    // TODO generer en nøkkel, hash og salt.
    return done(null, 'test')
    // If the key was not found
    // if (!isKeyFound) {
    //   console.log('❌ No matching API Key could be found');
    //   return done(null, false);
    // }
  })
