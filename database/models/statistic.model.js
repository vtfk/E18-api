/*
  Import dependencies
*/
const mongoose = require('mongoose')
const taskSchema = require('../schemas/task-statistic.schema');
const commonValues = require('./common')

/*
  Schema definition
*/
const schema = new mongoose.Schema({
  jobId: { type: mongoose.SchemaTypes.ObjectId },
  system: { type: String, required: true },
  projectId: { type: Number, required: true },
  type: { type: String },
  status: { type: String, enum: commonValues.jobStatuses, default: 'waiting' },
  parallel: { type: Boolean },
  e18: { type: Boolean },
  retries: { type: Number, default: 0 },
  tasks: { type: [taskSchema], required: true },
  createdTimestamp: { type: Date, default: new Date().toISOString() },
  modifiedTimestamp: { type: Date, default: new Date().toISOString() }
})

/*
  Export model based on the schema
*/
module.exports = mongoose.model('Statistic', schema)
