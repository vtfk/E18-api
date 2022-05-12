/*
  Import dependencies
*/
const mongoose = require('mongoose')

/*
    Schema definition
*/
const schema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 5, maxlength: 25 },
  hash: { type: String, required: true },
  enabled: { type: Boolean },
  createdTimeStamp: { type: Date, default: new Date().toISOString() },
  modifiedTimeStamp: { type: Date, default: new Date().toISOString() }
},
{ timestamps: true }) // let Mongoose automatically manage "createdAt" and "updatedAt" properties on the document

/*
    Export model basen on the schema
*/
module.exports = mongoose.model('ApiKeys', schema)
