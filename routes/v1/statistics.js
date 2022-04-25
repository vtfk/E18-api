/*
  Import dependencies
*/
const express = require('express')
const router = express.Router()
const dbTools = require('../../database/db.tools');
const Statistics = require('../../database/db').Statistic
const Jobs = require('../../database/db').Job
const vtfkutils = require('../../lib/vtfk-utilities/vtfk-utilities')
const { remove } = require('@vtfk/azure-blob-client');

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

// GET All items (leaned)
router.get('/lean', async (req, res, next) => {
  try {
    const data = await Statistics
      .find()
      .select('-e18 -parallel -retries -modifiedTimestamp -tasks.retries -tasks.dependencies -tasks.operations -__v')
      .lean();
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
    const jobs = await Jobs.find({
      $or: [
        { status: 'completed' },
        { status: 'retired' }
      ]
    })
    if (!jobs || (Array.isArray(jobs) && jobs.length <= 0)) return next()

    // This is done through a regular for loop to be able to use await
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]

      // Make a copy of the job and strip
      let copy = JSON.parse(JSON.stringify(job))
      copy = vtfkutils.removeKeys(copy, ['data', 'error', 'contact']);

      // Remove files
      if (copy.e18 === true) {
        // Get any tasks with files
        const tasksWithFiles = copy.tasks.filter(task => Array.isArray(task.files) && task.files.length > 0);

        // Remove the files and replace then with a filecount instead
        for (const task of tasksWithFiles) delete task.files;

        // Delete the blob folder
        if (tasksWithFiles.length > 0) await remove(copy._id);
      }

      // Create statistics entry
      try {
        await Statistics.create(copy)
      } catch (err) {
        if (!err || !err.message) throw err;
        // If it is a duplicate key error, it is safe to proceed and delete the job from the queue
        if (!err.message.includes('duplicate key error collection')) throw err;
      }

      // Delete the job
      await Jobs.deleteOne({ _id: job._id })
    }

    // Set the response body
    res.body = {
      transferedEntries: jobs.length
    }

    return next()
  } catch (err) {
    return next(err);
  }
})

/*
  Export route
*/
module.exports = router
