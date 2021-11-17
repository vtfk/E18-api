/*
  Import dependencies
*/
const mongoose = require('mongoose')
const taskSchema = require('../schemas/task-statisti.schema')

/*
  Schema definition
*/
const schema = new mongoose.Schema({
  jobId: { type: mongoose.SchemaTypes.ObjectId },
  system: { type: String, required: true },
  projectId: { type: Number, required: true },
  type: { type: String },
  status: { type: String, enum: ['waiting', 'running', 'suspended', 'completed', 'failed'], default: 'waiting' },
  e18: { type: Boolean },
  retries: { type: Number, default: 0 },
  tasks: { type: [taskSchema], required: true },
  createdTimestamp: { type: Date, default: Date.now() },
  modifiedTimestamp: { type: Date, default: Date.now() }
})

/*
  Export model based on the schema
*/
module.exports = mongoose.model('Job', schema)
