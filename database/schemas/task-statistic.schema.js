/*
  Import dependencies
*/
const mongoose = require('mongoose')
const commonSchemasValues = require('./common');
const commonValues = require('../common');


/*
  Sub schema
*/
const operation = new mongoose.Schema({
  status: { type: String, enum: commonSchemasValues.operationStatuses },
  createdTimestamp: { type: Date },
  modifiedTimestamp: { type: Date },
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
  status: { type: String, enum: commonValues.statuses, default: 'waiting' },
  retries: { type: Number, default: 0 },
  dependencyTag: { type: String },
  dependencies: { type: [String] },
  operations: { type: [operation] },
  createdTimestamp: { type: Date },
  modifiedTimestamp: { type: Date }
})

module.exports = schema
