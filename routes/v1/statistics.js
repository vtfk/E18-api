/*
  Import dependencies
*/
const express = require('express')
const router = express.Router()
const Statistics = require('../../database/db').Statistic;
const Jobs = require('../../database/db').Statistic;

/*
  Routes
*/
// GET
router.get('/', async (req, res, next) => {
  try {
    // Tasks that matches the criteria to be checked out
    const readyTasks = []
    // Retreive the jobs
    let jobs = []
    if (req.query.type) {
      jobs = await Job.find({
        status: { $ne: 'completed' },
        $and: [
          { 'tasks.status': { $ne: 'completed' } },
          { 'tasks.type': req.query.type }
        ]
      })
    } else {
      jobs = await Job.find({
        status: { $ne: 'completed' },
        'tasks.status': { $ne: 'competed' }
      })
    }

    // Just make double sure that the jobs are actually not completed
    jobs = jobs.filter((j) => j.status !== 'completed')

    // Determine if the tasks in the job matches the criteria to be checked out
    jobs.forEach((job) => {
      const collectedData = {}
      job.tasks.forEach((task, i) => {
        if (task.status === 'completed') {
          collectedData[task.type] = task.operations.find((o) => o.status === 'completed').data
          return
        } else if (task.status === 'running') {
          return
        } else if (i !== 0 && job.tasks[i - 1].status !== 'completed') {
          return
        }
        if (req.query.type) {
          if (req.query.type === task.type) {
            readyTasks.push({
              ...JSON.parse(JSON.stringify(task)),
              collectedData
            })
          }
        } else {
          readyTasks.push({
            ...JSON.parse(JSON.stringify(task)),
            collectedData
          })
        }
      })
    })

    // Only return jobs that are applicable to run
    res.body = readyTasks
    next()
  } catch (err) {
    return next(err)
  }
})

/**
 * Posts a new entry to the statistics collection
 */
router.post('/', async (req, res, next) => {
  try {
    req.body.e18 = false;
    Statistics.create(req.body);
  } catch (err) {
    return Promise.reject(err);
  }
})

router.post('/cleanup', async (req, res, next) => {
  // Retreive all completed jobs
  let jobs = Jobs.find({ status: 'completed' });

  jobs.forEach((job) => {
    // Strip away any data fields

    // Create statistics entry

    // Delete 
  })
})

/*
  Export route
*/
module.exports = router
