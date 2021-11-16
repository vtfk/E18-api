/*
  Import the dependencies
*/
const mongoose = require('mongoose');
const config = require('../config');
const tools = require('./db.tools');

/*
  Connect to the database
*/
console.log('Connecting to database')
mongoose.connect(
    config.dbConnetionString, { 
      useUnifiedTopology: false,
      useNewUrlParser: true
    }, (err) => {
        if(err) {
            console.log('❌ Error connecting to database');
        }
    }
)
mongoose.Promise = global.Promise;

/*
  Handle connectivity events
*/
mongoose.connection.on('connected', () => {
  console.log('✅ Database successfully connected')
})

mongoose.connection.on('disconnected', () => {
  console.log('❌ Database disconnected');
})

mongoose.connection.on('reconnected', function() {
  console.log('ℹ Database reconnected');
});

mongoose.connection.on('error', function(err) {
  console.log('MongoDB event error: ' + err);
});

module.exports = {
  client: mongoose,
  tools: tools,
  Job: require('./models/job.model')
}