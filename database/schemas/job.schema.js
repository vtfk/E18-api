/*
  Import dependencies
*/
const mongoose = require('mongoose')
const taskSchema = require('./task.schema')
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
  comment: { type: String },
  tags: { type: [String] },
  createdTimestamp: { type: Date, default: new Date() },
  modifiedTimestamp: { type: Date, default: new Date() }
},
{ timestamps: true }) // let Mongoose automatically manage "createdAt" and "updatedAt" properties on the document

/*
  Export
*/
module.exports = schema
