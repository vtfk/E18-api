/*
  Import the dependencies
*/
const mongoose = require('mongoose')
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const config = require('../config')
const tools = require('./db.tools')

/*
  Variables
*/
let mongoMemoryServer = undefined;
const mongooseConnectionOptions = {
  useUnifiedTopology: false,
  useNewUrlParser: true
}

// Function for connecting to MongoDB or MockDatabase
// Must be async because of MongoMemoryServer.create is async
async function connect() {
  // If mock, spin up an instance
  if(config.useMock && !mongoMemoryServer) {
    console.log('ℹ️ Creating mock database')
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'E18'
      }
    });
    config.dbConnetionString = mongoMemoryServer.getUri() + 'E18';
  }
  // Connect to the server
  mongoose.connect(
    config.dbConnetionString,
    mongooseConnectionOptions,
    (err) => {
      if (err) {
        console.log('❌ Error connecting to database')
        console.error(err);
      }
    }
  )
  mongoose.Promise = global.Promise
}

connect();

/*
  Handle connectivity events
*/
mongoose.connection.on('connected', () => {
  console.log('✅ Successully connected to database "' + config.dbConnetionString + '"')
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
  if(mongoMemoryServer) await mongoMemoryServer.exit();
})

module.exports = {
  client: mongoose,
  tools: tools,
  Job: require('./models/job.model'),
  Statistic: require('./models/statistic.model')
}
