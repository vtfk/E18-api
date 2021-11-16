/*
  Import dependencies
*/
const mongoose = require('mongoose')

/*
  Sub schema
*/
const operation = new mongoose.Schema({
  status: { type: String, enum: ['completed', 'failed'] },
  trackingId: { type: String },
  data: { type: Object },
  error: { type: Object }
})

/*
  Schema definition
*/
const schema = new mongoose.Schema({
  jobId: { type: String },
  type: { type: String, enum: ['svarut', 'p360archive', 'p360updateperson'] },
  status: { type: String, enum: ['waiting', 'running', 'completed', 'failed'], default: 'waiting' },
  retries: { type: Number, default: 0 },
  data: { type: Object },
  responseData: { type: Object },
  operations: { type: [operation] }
})

module.exports = schema
