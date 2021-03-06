/*
  Import dependencies
*/
const mongoose = require('mongoose')
const commonSchemaValues = require('./common')
const commonValues = require('../common')
const { comment, schemaTimestampsOption } = commonSchemaValues

/*
  Sub schema
*/
const operation = new mongoose.Schema({
  status: { type: String, enum: commonSchemaValues.operationStatuses, required: true },
  message: { type: String },
  trackingId: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  error: { type: mongoose.Schema.Types.Mixed }
},
{ ...schemaTimestampsOption })

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
  system: { type: String },
  method: { type: String },
  status: { type: String, enum: commonValues.statuses, default: 'waiting' },
  group: { type: String },
  delayUntil: { type: Date },
  retries: { type: Number, default: 0 },
  data: { type: Object },
  dataMapping: { type: mongoose.Schema.Types.Mixed },
  fileCount: { type: Number },
  files: {
    type: [file],
    default: undefined
  },
  regarding: { type: String },
  comments: { type: [comment] },
  tags: { type: [String] },
  operations: { type: [operation] }
},
{ ...schemaTimestampsOption })

module.exports = schema
