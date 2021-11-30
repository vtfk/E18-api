/*
  Import dependencies
*/
const express = require('express')
const router = express.Router()
const Job = require('../../database/db').Job
const Statistics = require('../../database/db').Statistic
const dbTools = require('../../database/db.tools.js')
const HTTPError = require('../../lib/vtfk-errors/httperror');
const validateJob = require('../../database/validators/job')
const { uploadBlob } = require('../../lib/blob-storage')
const { ObjectID } = require('mongodb')

/*
  Routes
*/
// GET
router.get('/', async (req, res, next) => {
  try {
    const jobs = await dbTools.requestDataByQuery(req, Job)
    res.body = jobs
    next()
  } catch (err) {
    return next(err)
  }
})

// POST
router.post('/', async (req, res, next) => {
  try {
    // Validate and sanitize the job
    const job = validateJob(req.body);

    // Move attachments to blob storage
    if (job.e18 === true) {
      job._id = new ObjectID()
      for await (const task of job.tasks) {
        if (!task.files) continue
        
        task._id = new ObjectID()
        for await (const file of task.files) {
          if (file.fileName && file.fileName.includes('/')) throw new HTTPError(500, 'Illegal character in fileName')

          const result = await uploadBlob({
            jobId: `${job._id}/${task._id}`,
            content: file.content,
            fileName: file.fileName || undefined
          })
          file.fileName = result.split('/').pop()
        }
      }
    }

    // Create and return the job
    res.body = await Job.create(job)
    next()
  } catch (err) {
    return next(err)
  }
})

// GET job by id
router.get('/:id', async (req, res, next) => {
  try {
    let result = await Job.findById(req.params.id);
    if (!result) result = await Statistics.findById(req.params.id);

    if (!result) throw new HTTPError(404, 'Job not found in queue or statistics');

    res.body = result;
    next()
  } catch (err) {
    return next(err)
  }
})

// Marks a job as completed, this only works for E18 = false jobs
router.put('/:id/complete', async (req, res, next) => {
  try {
    // Find the job by id and task id
    const job = await Job.findById(req.params.id);

    // Validate the job
    if (!job) throw new HTTPError(404, `Job with the taskId "${req.params.taskid}" could not be found`)
    if (job.e18 !== false) throw new HTTPError(404, 'You are not allowed to complete a job handled by E18')
    if (job.status === 'completed') return job;

    // Set the status as completed
    job.status = 'completed';

    // Save the change
    res.body = job.save();
    return next();
  } catch (err) {
    return next(err);
  }
})

/*
  Tasks
*/
// Get all tasks
router.get('/:id/tasks', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
    res.body = job.tasks
    next()
  } catch (err) {
    return next(err)
  }
})

// Post a new task to the job
router.post('/:id/tasks', async (req, res, next) => {
  try {
    // Find the job
    let job = await Job.findById(req.params.id);
    if (!job) throw new HTTPError(404, `The job with id ${req.params.id} was not found`);
    // Validation
    if (job.e18 !== false) throw new HTTPError(400, 'You can only post additional task to jobs not handled by E18');

    // Push and save the task
    job.tasks.push(req.body);

    // Validate & sanitize
    job = validateJob(job);

    // TODO: sjekke om attachments er med og dytte til blob

    // Save changes
    const updated = await job.save();

    // Return the saved task
    res.body = updated.tasks[updated.tasks.length - 1];
    next()
  } catch (err) {
    return next(err)
  }
})

// Checkout a task
router.put('/:id/tasks/:taskid/checkout', async (req, res, next) => {
  try {
    // Find the job by id and task id
    const job = await Job.findOne({ _id: req.params.id, 'tasks._id': req.params.taskid })

    // Validate the job
    if (!job) throw new HTTPError(404, `Job with the taskId "${req.params.taskid}" could not be found`)
    if (job.status === 'completed') throw new HTTPError(400, 'Cannot checkout a task from a job that is completed')

    // Get the task
    const taskIndex = job.tasks.findIndex((t) => t._id.toString() === req.params.taskid.toString())
    const task = job.tasks[taskIndex] // Just use this for reading values, writes to this will not be saved. Use job.tasks[taskIndex] instead

    // Check if the task is unavailable to checkout
    switch (task.status) {
      case 'running':
        throw new HTTPError(400, 'Already running')
      case 'completed':
        throw new HTTPError(400, 'Already completed')
      case 'failed':
        job.tasks[taskIndex].retries += 1
    }

    // Check if there are previous tasks that are not completed
    const collectedData = {}
    if (taskIndex > 0) {
      for (let i = 0; i < taskIndex; i++) {
        // If job mode is sequancial
        if (!job.parallel) {
          // Check if there are preceding tasks that are not completed yet
          if (task.status !== 'completed' && job.parallel === false) throw new HTTPError(400, 'There are preceding tasks that are not completed yet')
        } else {
          // Check if there are dependant tasks that are not completed yet
          if (task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0) {
            const incompleteDependencies = job.tasks.filter((t) => task.dependencies.includes(t.dependencyTag) && t.status !== 'completed')
            if (incompleteDependencies.length > 0) {
              throw new HTTPError(400, `There are ${incompleteDependencies.length} dependant tasks that are not completed yet`)
            }
          }
        }
        // Add completed information to the array
        collectedData[job.tasks[i].type + '-' + (i)] = job.tasks[i].operations.filter((o) => o.status === 'completed')[0].data
      }
    }

    // Set the status to running
    job.tasks[taskIndex].status = 'running'

    // Update the job
    job.status = 'running'
    job.save()

    // Create the response object
    const reponse = {
      ...JSON.parse(JSON.stringify(job.tasks[taskIndex])),
      collectedData: collectedData
    }

    // Set the return value and continue
    res.body = reponse
    next()
  } catch (err) {
    return next(err)
  }
})

// Post operation to task
router.post('/:id/tasks/:taskid/operations', async (req, res, next) => {
  try {
    // Constants
    const COMPLETED_STATUS = 'completed'

    // Find the job by id and task id
    const job = await Job.findOne({ _id: req.params.id, 'tasks._id': req.params.taskid })

    // Validate the job
    if (!job) throw new HTTPError(404, `Job with the taskId "${req.params.taskid}" could not be found`)
    if (job.status === 'completed') throw new HTTPError(400, 'Cannot checkout a task from a job that is completed')

    // Get the task and push the operation to the array
    const taskIndex = job.tasks.findIndex((t) => t._id.toString() === req.params.taskid.toString())

    // Make sure that you cannot add operations to a task that is already completed
    if (job.tasks[taskIndex].status === COMPLETED_STATUS) throw new HTTPError(400, 'You cannot report operations to a task that is already completed')

    // Set the task status
    switch (req.body.status) {
      case 'completed':
        job.tasks[taskIndex].status = COMPLETED_STATUS
        break
      case 'failed':
        job.tasks[taskIndex].status = 'failed'
        break
    }

    // Push the operation
    job.tasks[taskIndex].operations.push(req.body)

    // Update retries on task from response
    if (req.body.retries) {
      if (typeof req.body.retries === 'number' && req.body.retries > 0) job.tasks[taskIndex].retries += req.body.retries
      else if (Array.isArray(req.body.retries)) job.tasks[taskIndex].retries += req.body.retries.length
      else if (typeof req.body.retries === 'string' && parseInt(req.body.retries)) job.tasks[taskIndex].retries += parseInt(req.body.retries)
    }

    // If completed, check if every task is completed, if so set the job as completed
    if (job.tasks.length === job.tasks.filter((f) => f.status === COMPLETED_STATUS).length) {
      job.status = COMPLETED_STATUS
    }

    // Save the job
    await job.save()

    // Return the task
    res.body = job.tasks[taskIndex]
    next()
  } catch (err) {
    return next(err)
  }
})

/*
  Export the router
*/
module.exports = router
