/*
  Import dependencies
*/
const mongoose = require('mongoose')
const apikeysSchema = require('../schemas/apikeys.schema');

/*
    Export model basen on the schema
*/
module.exports = mongoose.model('ApiKeys', apikeysSchema)
