/*
    Import dependencies
*/
const HeaderAPIKeyStrategy = require('passport-headerapikey').HeaderAPIKeyStrategy
const ApiKeys = require('../../database/db').ApiKeys
const crypto = require('crypto')

module.exports = new HeaderAPIKeyStrategy(
  {
    header: 'X-API-KEY'
  },
  false,
  async (apikey, done) => {
    // If development or test, just return OK.
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      console.log(`✅ Successfully authenticated due to beeing in "${process.env.NODE_ENV}" mode`);
      return done(null, 'ok');
    };

    // Hash the provided key
    const hash = crypto.createHash('sha512').update(apikey).digest('hex');
    // Check if the key exists
    const existingKey = await ApiKeys.findOne({ hash: hash });
    // If the key don't exist
    if (!existingKey) return done(null);
    // Return ok
    console.log('✅ Successfully authenticated "' + existingKey.name + '"');
    return done(null, existingKey);
  }
)
