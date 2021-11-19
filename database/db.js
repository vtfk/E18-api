/*
  Import the dependencies
*/
const mongoose = require('mongoose')
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
const config = require('../config')
const tools = require('./db.tools')

/*
  State & Variables
*/
let isConnecting = false;
let connection = undefined;             // The mongoose connection
let connectionPromise = undefined  // This will be a promise when mongoose is connecting
let mongoMemoryServer = undefined;      // The mongoMemoryServer object
const mongooseConnectionOptions = {     // The mongoose connection options
  useUnifiedTopology: false,
  useNewUrlParser: true
}
const mongoMemoryServerOptions = {
  instance: {
    dbName: 'E18'
  }
}


connect();

/*
  Functions
*/
async function connect() {
  // Check if database is connecting or connected
  if(connectionPromise) return connectionPromise;
  if(mongoose.connection.readyState !== 0) return;

  // Create common promise for both the MongoMemoryServer and Mongoose connection
  // resolveConnection will be called when both are completed, in the meantime any calls to connect() will receive this promise.
  let resolveConnection, rejectConnection
  connectionPromise = new Promise((resolve, reject) => { resolveConnection = resolve; rejectConnection = reject; })

  // If mock, spin up an instance
  if (config.useMock && config.useMock != false && !mongoMemoryServer) {
    console.log('ℹ️ Creating mock database')
    mongoMemoryServer = await MongoMemoryServer.create(mongoMemoryServerOptions);
    config.dbConnectionString = mongoMemoryServer.getUri() + 'E18'
  }

  // Connect to the server
  console.log('Connecting to database: ' + config.dbConnectionString)
  try {
    await mongoose.connect(config.dbConnectionString, mongooseConnectionOptions);
    resolveConnection();
    mongoose.Promise = global.Promise
  } catch (err) {
    console.log('❌ Error connecting to database')
    console.error(err)
    rejectConnection(err);
    return Promise.reject(err);
  }
}

async function disconnect() {
  console.log('ℹ️ Disconnecting database')
  if (connection) connection.disconnect();
  mongoose.disconnect();
  mongoose.connection.close();
  if (mongoMemoryServer) await mongoMemoryServer.stop();
}

/*
  Handle connectivity events
*/
mongoose.connection.on('connected', () => {
  console.log('✅ Successully connected to database "' + config.dbConnectionString + '"')
})

mongoose.connection.on('disconnected', () => {
  console.log('❌ Database disconnected')
})

mongoose.connection.on('reconnected', function () {
  console.log('ℹ Database reconnected')
})

mongoose.connection.on('error', function (err) {
  console.log('MongoDB event error: ' + err)
})

process.on('exit', async () => {
  await this.disconnect();
})

// Export database models
module.exports = {
  client: mongoose,
  connectionPromise: connectionPromise,
  connect: connect,
  disconnect: disconnect,
  Job: require('./models/job.model'),
  Statistic: require('./models/statistic.model')
}