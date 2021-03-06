/*
  Import dependencies
*/
const mongoose = require('mongoose')
const taskSchema = require('./task.schema')
const { comment, schemaTimestampsOption } = require('./common')
const commonValues = require('../common')

/*
  Schema definition
*/
const schema = new mongoose.Schema({
  system: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, enum: commonValues.statuses, default: 'waiting' },
  projectId: { type: Number, required: true },
  e18: { type: Boolean, default: true },
  parallel: { type: Boolean, default: false },
  delayUntil: { type: Date },
  retries: { type: Number, default: 0 },
  tasks: { type: [taskSchema], required: true, default: [] },
  regarding: { type: String },
  contact: { type: String },
  comments: { type: [comment] },
  tags: { type: [String] }
},
{ ...schemaTimestampsOption })

/*
  Export
*/
module.exports = schema
