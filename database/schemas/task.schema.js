/*
  Import dependencies
*/
const mongoose = require('mongoose');
const commonValues = require('./common');

/*
  Sub schema
*/
const operation = new mongoose.Schema({
  status: { type: String, enum: commonValues.operationStatuses },
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
  dependencyTag: { type: String },
  dependencies: { type: [String] },
  operations: { type: [operation] },
  createdTimestamp: { type: Date },
  modifiedTimestamp: { type: Date }
})

module.exports = schema
