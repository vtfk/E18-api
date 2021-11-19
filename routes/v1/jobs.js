/*
  Import dependencies
*/
const express = require('express')
const router = express.Router()
const Job = require('../../database/db').Job
const Statistics = require('../../database/db').Statistic
const dbTools = require('../../database/db.tools.js')
const HTTPError = require('../../lib/vtfk-errors/httperror');
const utilities = require('../../lib/vtfk-utilities/vtfk-utilities');

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
    // Validate that the tasks dont have duplicated types
    const job = req.body

    let taskTypes = []          // Array for alle unike task typer som er funnet i jobben
    let dependencyTags = []     // Array over alle unike 
    let dependencies = []
    job.tasks.forEach((task) => {
      // If the task should be processed by E18, but no data has been provided
      if(job.e18 !== false && !task.data) throw new HTTPError(400, 'Data must be provided on all tasks for E18 to process them');
      // Make dependencyTag checks
      if(task.dependencyTag) {
        // Task cannot have dependency tag when there is only a single task
        if(job.tasks.length === 1) throw new HTTPError(400, 'DependencyTag cannot be set when there is only a single task');
        // Task cannot be dependent on it self
        if(task.dependencies && task.dependencies.includes(task.dependencyTag)) throw new HTTPError(400, 'Task cannot have it self as a dependency');
        // Add the dependencyTag to the dependencyTagsArray if not already present
        if (!dependencyTags.includes(task.dependencyTag)) dependencyTags.push(task.dependencyTag)
      }
      // Make dependencies check
      if(task.dependencies) {
        // If task has dependencies, but there are no other tasks
        if(job.tasks.length === 1) throw new HTTPError(400, 'Task cannot have dependencies when there are no other tasks');
        // Check if there are more dependencies than there are tasks
        if(task.dependencies.length > job.tasks.length) throw new HTTPError(400, 'There cannot be more dependencies than there are tasks');
        // Add any dependencies to the array that have not been previously added
        task.dependencies.forEach((d) => {
          if(!dependencies.includes(d)) dependencies.push(d);
        })
      }
      
      // Add tasktype to taskTypes if not previously found
      if (!taskTypes.includes(task.type)) taskTypes.push(task.type)
      // else throw new HTTPError(400, 'task type cannot be added more than once: ' + task.type)
    })

    // If the number of unique dependency tags and dependencies don't match up something is wrong
    if (dependencyTags.length !== dependencies.length) throw new HTTPError(400, 'There is a mismatch between dependencyTags and dependencies');

    // Make sure that all the specified dependecytags has been used by the dependencies
    if (dependencyTags.length > 0) {
      dependencyTags.forEach((tag) => {
        let match = dependencies.find((d) => dependencyTags.includes(d));
        if(!match) throw new HTTPError(400, `The dependency tags ${tag} is set but not used`)
      })
    }

    // Make sure that all dependencies has a correlating tag
    if (dependencies.length > 0) {
      dependencies.forEach((dependency) => {
        let match = dependencyTags.find((t) => dependencies.includes(t));
        if(!match) throw new HTTPError(400, `The dependency ${dependency} is used, but has not been set`)
      })
    }

    // Throw error if dependency tags are not matching
    if(dependencyTags.length > 0) {
      console.log('Found dependencies (' + dependencies.length + ')');
      console.log(dependencies);
      console.log('Dependency tags (' + dependencyTags.length + ')');
      console.log(dependencyTags);
      console.log('JOB');
      utilities.inspect(req.body);
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
    if(!result) result = await Statistics.findById(req.params.id);

    if(!result) throw new HTTPError(404, 'Job not found in queue or statistics');

    res.body = result;
    next()
  } catch (err) {
    return next(err)
  }
})

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
