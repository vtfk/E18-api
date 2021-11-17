/*
  Import dependencies
*/
const mongoose = require('mongoose')
const commonValues = require('./common');


/*
  Sub schema
*/
const operation = new mongoose.Schema({
  status: { type: String, enum: commonValues.operationStatuses }, // @karleinarb : Should this use jobStatuses so we only have one list ?
  trackingId: { type: String },
  error: { type: Object }
})

/*
  Schema definition
*/
const schema = new mongoose.Schema({
  system: { type: String, enum: commonValues.taskSystems },
  method: { type: String },
  status: { type: String, enum: commonValues.taskStatuses, default: 'waiting' }, // @karleinarb : Should this use jobStatuses so we only have one list ?
  retries: { type: Number, default: 0 },
  dependencyTag: { type: String },
  dependencies: { type: [String] },
  operations: { type: [operation] }
})

module.exports = schema
