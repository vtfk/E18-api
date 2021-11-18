/*
  Import dependencies
*/
const express = require('express')
const router = express.Router()
const Job = require('../../database/db').Job

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
        } else if (!job.parallel && i !== 0 && job.tasks[i - 1].status !== 'completed') {
          return
        }
        // If paralell exectuion, check if there are uncompleted dependencies
        if (job.parallel) {
          if (task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0) {
            const incompleteDependencies = jobs.tasks.filter((t) => task.dependencies.includes(t.dependencyTag) && t.status !== 'completed')
            if (incompleteDependencies.length > 0) return
          }
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

/*
  Export route
*/
module.exports = router
