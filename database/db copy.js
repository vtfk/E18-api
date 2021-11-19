/*
  Import the dependencies
*/
const mongoose = require('mongoose')
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
const config = require('../config')
const tools = require('./db.tools')


let test = '';
class DB {
  /*
    Variables
  */
  constructor() {
    this.mongoMemoryServer;
    const mongooseConnectionOptions = {
      useUnifiedTopology: false,
      useNewUrlParser: true
    }
  }

  // Function for connecting to MongoDB or MockDatabase
  // Must be async because of MongoMemoryServer.create is async
  async connect () {
    if(mongoose.connection.readyState !== 0) return;
    test = 'Initialized';
    // If mock, spin up an instance
    if (!this.mongoMemoryServer && !config.dbConnectionString) {
      console.log('ℹ️ Creating mock database')
      this.mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'E18'
        }
      })
      config.dbConnectionString = this.mongoMemoryServer.getUri() + 'E18'
    }
    // Connect to the server
    console.log('Connecting to database: ' + config.dbConnectionString)
    try {
      await mongoose.connect(config.dbConnectionString, this.mongooseConnectionOptions);
      mongoose.Promise = global.Promise

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
        await disconnect();
      })

    } catch (err) {
      console.log('❌ Error connecting to database')
      console.error(err)
      return Promise.reject(err);
    }
  }

  async disconnect() {
    console.log('Disconnecting');
    console.log('Test: ' + this.test);
    await mongoose.disconnect();
    await mongoose.connection.close();
    console.log(this.mongoMemoryServer);
    if (this.mongoMemoryServer) {
      console.log('Closing memory server');
      await this.mongoMemoryServer.stop();
    }
  }
}

module.exports = new DB();

// module.exports = {
//   client: mongoose,
//   tools: tools,
//   connect: connect,
//   disconnect: disconnect,
//   Job: require('./models/job.model'),
//   Statistic: require('./models/statistic.model')
// }
