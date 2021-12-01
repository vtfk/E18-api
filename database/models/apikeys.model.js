/*
  Import dependencies
*/
const mongoose = require('mongoose')

/*
    Schema definition
*/
const schema = new mongoose.Schema({
    name: { type: String, required: true, minlength: 5, maxlength: 25 },
    enabled: { type: Boolean },
    createdTimeStamp: { type: Date, default: new Date().toISOString() },
    modifiedTimeStamp: { type: Date, default: new Date().toISOString() }
})

/*
    Export model basen on the schema
*/
module.exports = mongoose.model('ApiKeys', schema)