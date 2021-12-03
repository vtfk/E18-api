/*
  Import dependencies
*/
const mongoose = require('mongoose')
const commonSchemaValues = require('./common')
const commonValues = require('../common')

/*
  Sub schema
*/
const operation = new mongoose.Schema({
  status: { type: String, enum: commonSchemaValues.operationStatuses, required: true },
  message: { type: String },
  createdTimestamp: { type: Date, default: new Date() },
  trackingId: { type: String },
  data: { type: Object },
  error: { type: Object }
})

const file = new mongoose.Schema({
  _id: false,
  fileName: {
    type: String
  }
})

/*
  Schema definition
*/
const schema = new mongoose.Schema({
  system: { type: String, enum: commonValues.taskSystems },
  method: { type: String },
  status: { type: String, enum: commonValues.statuses, default: 'waiting' },
  retries: { type: Number, default: 0 },
  data: { type: Object },
  fileCount: { type: Number },
  files: {
    type: [file],
    default: undefined
  },
  dependencyTag: { type: String },
  dependencies: { type: [String] },
  operations: { type: [operation] },
  createdTimestamp: { type: Date, default: new Date() },
  modifiedTimestamp: { type: Date }
})

module.exports = schema
