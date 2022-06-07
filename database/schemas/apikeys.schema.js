/*
  Import dependencies
*/
const mongoose = require('mongoose')
const { schemaTimestampsOption } = require('./common')

/*
    Schema definition
*/
const schema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 5, maxlength: 25 },
  hash: { type: String, required: true },
  enabled: { type: Boolean }
},
{ ...schemaTimestampsOption })

/*
  Export
*/
module.exports = schema
