module.exports = {
  hostname: process.env.HOSTNAME || '0.0.0.0',
  port: process.env.PORT || 8088,
  dbConnetionString: process.env.DBCONNECTIONSTRING,
  useMock: process.env.USE_MOCK
}
