/*
  Import dependencies
*/
const mongoose = require('mongoose')
const taskSchema = require('../schemas/task.schema')
const commonValues = require('./common')

/*
  Schema definition
*/
const schema = new mongoose.Schema({
  system: { type: String, required: true },
  type: { type: String },
  status: { type: String, enum: commonValues.jobStatuses, default: 'waiting' }, // @karleinarb : Should this be a default for all statuses ?
  projectId: { type: Number, required: true },
  parallel: { type: Boolean },
  retries: { type: Number, default: 0 },
  tasks: { type: [taskSchema], required: true },
  createdTimestamp: { type: Date, default: new Date().toISOString() },
  modifiedTimestamp: { type: Date, default: new Date().toISOString() }
}, { collection: 'queue' })

/*
  Export model based on the schema
*/
module.exports = mongoose.model('Job', schema)
