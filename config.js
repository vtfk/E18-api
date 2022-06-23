/*
  Import dependencies
*/
const path = require('path');
const envPath = path.resolve(__dirname, `.env.${process.env.NODE_ENV}`);
require('dotenv').config({ path: envPath }) // Load different .env files based on NODE_ENV

/*
  Export config
*/
module.exports = {
  hostname: process.env.HOSTNAME || '0.0.0.0',
  port: process.env.PORT || 8088,
  dbConnectionString: process.env.DBCONNECTIONSTRING,
  useMock: process.env.USE_MOCK,
  E18_REQUEST_LIMIT_MB: process.env.E18_REQUEST_LIMIT_MB || '25',
  APPLICATIONINSIGHTS_CONNECTION_STRING: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  RATELIMIT_WINDOW_MS: process.env.RATELIMIT_WINDOW_MS,
  RATELIMIT_WINDOW_LIMIT: process.env.RATELIMIT_WINDOW_LIMIT,
  RATELIMIT_MESSAGE: process.env.RATELIMIT_MESSAGE || 'APPAPPAPPAPPAPP'
}
