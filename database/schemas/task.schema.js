/*
  Import dependencies
*/
const mongoose = require('mongoose')

/*
  Sub schema
*/
const operation = new mongoose.Schema({
  status: { type: String, enum: ['completed', 'failed'] },
  trackingId: { type: String },
  data: { type: Object },
  error: { type: Object }
})

/*
  Schema definition
*/
const schema = new mongoose.Schema({
  system: { type: String, enum: commonValues.taskSystems },
  method: { type: String },
  status: { type: String, enum: commonValues.taskStatuses, default: 'waiting' },
  retries: { type: Number, default: 0 },
  data: { type: Object },
  responseData: { type: Object },
  operations: { type: [operation] },
  createdTimestamp: { type: DateTime },
  modifiedTimestamp: { type: DateTime }
})

module.exports = schema
