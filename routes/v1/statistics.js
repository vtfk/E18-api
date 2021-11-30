/*
  Import dependencies
*/
const express = require('express')
const router = express.Router()
const dbTools = require('../../database/db.tools');
const Statistics = require('../../database/db').Statistic
const Jobs = require('../../database/db').Job
const vtfkutils = require('../../lib/vtfk-utilities/vtfk-utilities')

/*
  Routes
*/
// GET
router.get('/', async (req, res, next) => {
  try {
    const data = await dbTools.requestDataByQuery(req, Statistics)
    res.body = data
    next()
  } catch (err) {
    return next(err)
  }
})

// Maintenance - Creates statistics and deletes completed jobs
router.post('/maintain', async (req, res, next) => {
  try {
    // Retreive all completed jobs
    const jobs = await Jobs.find({ status: 'completed' })
    if (!jobs || (Array.isArray(jobs) && jobs.length <= 0)) return next()

    // This is done through a regular for loop to be able to use await
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]

      // Make a copy of the job and strip
      let copy = JSON.parse(JSON.stringify(job))
      copy = vtfkutils.removeKeys(copy, ['data'])

      // Create statistics entry
      await Statistics.create(copy)

      // Delete the job
      await Jobs.deleteOne({ _id: job._id })
    }

    next()
  } catch (err) {
    return Promise.reject(err)
  }
})

/*
  Export route
*/
module.exports = router
