/*
  Import dependencies
*/
const express = require('express')
const router = express.Router()
const Job = require('../../database/db').Job
const merge = require('lodash.merge');

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
        $or: [
          { status: 'waiting' },
          { status: 'failed' }
        ],
        e18: true,
        $and: [
          { 'tasks.status': { $ne: 'completed' } },
          { 'tasks.type': req.query.type }
        ]
      }).lean()
    } else {
      jobs = await Job.find({
        $or: [
          { status: 'waiting' },
          { status: 'failed' }
        ],
        e18: true,
        'tasks.status': { $ne: 'competed' }
      }).lean()
    }

    // Just make double sure that the jobs are actually not completed
    jobs = jobs.filter((j) => j.status !== 'completed' || j.status !== 'retired' || j.status !== 'suspended')

    if (!jobs || jobs.length === 0) {
      res.body = [];
      return next();
    }

    // Determine if the tasks in the job matches the criteria to be checked out
    for (const job of jobs) {
      const collectedData = {}
      if (!job.tasks) continue
      let taskIndex = -1;
      for (const task of job.tasks) {
        taskIndex++;
        if (task.status === 'completed') {
          collectedData[task.type] = task.operations.find((o) => o.status === 'completed').data
          continue;
        } else if (task.status === 'running') {
          continue
        } else if (!job.parallel && taskIndex !== 0 && job.tasks[taskIndex - 1].status !== 'completed') {
          continue
        } else if (task.operations.filter((o) => o.status === 'failed').length >= 3) {
          continue;
        }

        // If paralell exectuion, check if there are uncompleted dependencies
        if (job.parallel) {
          if (task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0) {
            const incompleteDependencies = jobs.tasks.filter((t) => task.dependencies.includes(t.dependencyTag) && t.status !== 'completed')
            if (incompleteDependencies.length > 0) continue
          }
        }

        // Make a copy of the task and include jobId
        const taskCopy = { jobId: job._id, jobStatus: job.status, ...task }

        // Make a merged object with collectedData and task data
        const data = merge(collectedData, task.data);

        // Create an request object for the orchestrator to use, this is only for QOL as we do not need to build this in the LogicApp
        const orchestratorRequest = {
          jobId: job._id,
          taskId: task._id,
          ...data
        }

        // Add to the readyTasks array
        if (req.query.type && req.query.type === task.type) {
          readyTasks.push({
            ...taskCopy,
            data,
            request: orchestratorRequest
          })
        } else {
          readyTasks.push({
            ...taskCopy,
            data,
            request: orchestratorRequest
          })
        }
      }
    }

    // Only return jobs that are applicable to run
    res.body = readyTasks
    return next();
  } catch (err) {
    return next(err)
  }
})

/*
  Export route
*/
module.exports = router
