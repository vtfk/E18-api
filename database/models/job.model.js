/*
  Import dependencies
*/
const mongoose = require('mongoose');
const jobSchema = require('../schemas/job.schema');

jobSchema.set('collection', 'queue');

/*
  Export model based on the schema
*/
module.exports = mongoose.model('Job', jobSchema)
