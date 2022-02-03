/*
  Import dependencies
*/
const express = require('express')
const router = express.Router()
const Job = require('../../database/db').Job
const merge = require('lodash.merge');
const { getTaskData } = require('../../lib/vtfk-utilities/vtfk-utilities')

/*
  Routes
*/
// GET
router.get('/', async (req, res, next) => {
  try {
    // Tasks that matches the criteria to be checked out
    const readyTasks = []
    // Construct query to db
    const query = {
      $or: [
        { status: 'waiting' },
        { status: 'running' },
        { status: 'failed' }
      ],
      e18: true
    }
    if (req.query.type) query['tasks.type'] = req.query.type

    // Retreive the jobs
    const rawJobs = await Job.find(query).lean()
    // And just make double sure that the jobs are actually not completed
    const jobs = rawJobs.filter(j => j.status !== 'completed' && j.status !== 'retired' && j.status !== 'suspended')

    if (!jobs || jobs.length === 0) {
      res.body = [];
      return next();
    }

    // Determine if the tasks in the job matches the criteria to be checked out
    const taskGroupShield = Math.floor(Math.random() * 10000000000); // This has to be something unique, it makes it easier to logically check the group names
    let currentTaskGroup = taskGroupShield;
    for (const job of jobs) {
      let collectedData = {}
      // If the job don't have any tasks.
      if (!job.tasks) continue
      // If the delayUntil timestamp has not yet been passed
      if (job.delayUntil && Date.parse(job.delayUntil) > Date.now()) continue;

      // Loop through all task to determine who are ready for execution
      let taskIndex = -1;
      for (const task of job.tasks) {
        taskIndex++;

        /*
          Determine if the task should be skipped
        */
        if (task.status === 'completed') {
          // If the task has already completed, retreive it's data and carry on
          const completedOperation = task.operations.find((o) => o.status === 'completed');
          if (completedOperation?.data && typeof completedOperation.data === 'object') collectedData = merge(collectedData, completedOperation?.data)
          continue;
        } else if (task.status === 'running') {
          // If the task is already running
          continue
        } else if (task.operations.filter((o) => o.status === 'failed').length >= 3) {
          // If the task has previously failed 3 or more times
          continue;
        } else if (task.delayUntil && Date.parse(task.delayUntil) > Date.now()) {
          // If the delayUntil has not been reached yet
          continue;
        } else if (!job.parallel) {
          // Check if every task before this one is completed
          let allPrecedingTasksCompleted = true;
          for (let i = 0; i < taskIndex; i++) {
            if (!job.tasks[i].operations || !Array.isArray(job.tasks[i].operations)) allPrecedingTasksCompleted = false;
            if (!job.tasks[i].operations.find((o) => o.status === 'completed')) allPrecedingTasksCompleted = false;
          }
          // If the job is not parallell AND the task is not in the current taskGroup AND the previous task has not completed yet
          if (task.group !== currentTaskGroup && !allPrecedingTasksCompleted) continue
        }

        // Set what the current task group is
        currentTaskGroup = task.group || taskGroupShield;

        // Make a copy of the task and include jobId
        const taskCopy = { jobId: job._id, jobStatus: job.status, ...task }
        // Make a merged object with collectedData and task data
        if (((task.data && typeof task.data === 'object') || !task.data) && task.dataMapping) {
          if (!task.data) taskCopy.data = {};
          taskCopy.data = getTaskData(task.dataMapping, collectedData, taskCopy.data);
        }

        // Add to the readyTasks array
        readyTasks.push(taskCopy)
      }
    }

    // Is specified, also checkout the tasks
    if (req.query.checkout === true) {
      // Retreive the ID of all the tasks that should be updated
      const taskIds = readyTasks.map((t) => t._id.toString());
      // Update that status of the job and tasks to running
      await Job.updateMany({ 'tasks._id': { $in: taskIds } }, { $set: { status: 'running', 'tasks.$.status': 'running' } }, { new: true });
      // Also update readyTasks, just to be consistent with what is written to the database
      readyTasks.forEach((t) => { t.status = 'running'; t.jobStatus = 'running' });
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
