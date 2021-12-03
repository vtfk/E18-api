/*
  Import dependencies
*/
const mongoose = require('mongoose')
const jobSchema = require('../schemas/job.schema');

// Set the collection
jobSchema.set('collection', 'statistics');

/*
  Export model based on the schema
*/
module.exports = mongoose.model('Statistic', jobSchema)
