/*
  Import dependencies
*/
const express = require('express');
const router = express.Router();
const Job = require('../../database/db').Job;
const dbTools = require('../../database/db.tools.js')
const HTTPError = require('../../lib/vtfk-errors/httperror');

/*
  Routes
*/
// GET
router.get('/', async (req, res, next) => {
  try {
    let jobs = await dbTools.requestDataByQuery(req, Job);
    res.body = jobs;
    next();
  } catch (err) {
    return next(err);
  }
})

// POST
router.post('/', async (req, res, next) => {
  try {
    // Validate that the tasks dont have duplicated types
    let types = [];
    console.log('== Tasks ==');
    console.log(req.body.tasks);
    req.body.tasks.forEach((task) => {
      if(!types.includes(task.type)) types.push(task.type)
      else throw new HTTPError(400, 'task type cannot be added more than once: ' + task.type)
    })
    console.log('== Types == ');
    console.log(types);

    // Create and return the job
    res.body = await Job.create(req.body);
    next();
  } catch (err) {
    return next(err);
  }
})

// GET job by id
router.get('/:id', async (req, res, next) => {
  try {
    res.body = await Job.findById(req.params.id);
    next();
  } catch (err) {
    return next(err);
  }
})

// Get all tasks
router.get('/:id/tasks', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    res.body = job.tasks;
    next();
  } catch (err) {
    return next(err);
  }
})

// Checkout a task
router.put('/:id/tasks/:taskid/checkout', async (req, res, next) => {
  try {
    // Find the job by id and task id
    let job = await Job.findOne({ _id: req.params.id, 'tasks._id': req.params.taskid});

    // Validate the job
    if(!job) throw new HTTPError(404, `Job with the taskId "${req.params.taskid}" could not be found`);    
    if(job.status === 'completed') throw new HTTPError(400, 'Cannot checkout a task from a job that is completed');

    // Get the task
    let taskIndex = job.tasks.findIndex((t) => t._id.toString() === req.params.taskid.toString());

    // Check if the task is unavailable to checkout
    switch(job.tasks[taskIndex].status) {
      case 'running':
        throw new HTTPError(400, 'Already running');
      case 'completed':
        throw new HTTPError(400, 'Already completed');
      case 'failed':
        job.tasks[taskIndex].retries += 1;
    }

    // Check if there are previous tasks that are not completed
    let collectedData = {};
    if(taskIndex > 0) {
      for(let i = 0; i < taskIndex; i++) {
        if(job.tasks[i].status !== 'completed') throw new HTTPError(400, 'There are preceding tasks that are not completed yet');
        collectedData[job.tasks[i].type] = job.tasks[i].operations.filter((o) => o.status === 'completed')[0].data;
      }
    }

    // Set the status to running
    job.tasks[taskIndex].status = 'running';

    // Update the job
    job.status = 'running';
    job.save();

    // Create the response object
    const reponse = {
      ...JSON.parse(JSON.stringify(job.tasks[taskIndex])),
      collectedData: collectedData
    }

    // Set the return value and continue
    res.body = reponse;
    next();
  } catch (err) {
    return next(err);
  }
})

// Post operation to task
router.post('/:id/tasks/:taskid/operations', async (req, res, next) => {
  try {
    // Constants
    const COMPLETED_STATUS = 'completed';

    // Find the job by id and task id
    let job = await Job.findOne({ _id: req.params.id, 'tasks._id': req.params.taskid});

    // Validate the job
    if(!job) throw new HTTPError(404, `Job with the taskId "${req.params.taskid}" could not be found`);    
    if(job.status === 'completed') throw new HTTPError(400, 'Cannot checkout a task from a job that is completed');

    // Get the task and push the operation to the array
    let taskIndex = job.tasks.findIndex((t) => t._id.toString() === req.params.taskid.toString());

    // Make sure that you cannot add operations to a task that is already completed
    if(job.tasks[taskIndex].status === COMPLETED_STATUS) throw new HTTPError(400, 'You cannot report operations to a task that is already completed');

    // Set the task status
    switch(req.body.status) {
      case 'completed':
        job.tasks[taskIndex].status = COMPLETED_STATUS;
        break;
      case 'failure':
        job.tasks[taskIndex].status = 'failed';
        break;
    }

    // Push the operation
    job.tasks[taskIndex].operations.push(req.body);

    // Update retries on task from response
    if(req.body.retries) {
      if(typeof req.body.retries === 'number' && req.body.retries > 0) job.tasks[taskIndex].retries += req.body.retries
      else if(Array.isArray(req.body.retries)) job.tasks[taskIndex].retries += req.body.retries.length;
      else if(typeof req.body.retries === 'string' && parseInt(req.body.retries)) job.tasks[taskIndex].retries += parseInt(req.body.retries);
    }

    // If completed, check if every task is completed, if so set the job as completed
    if(job.tasks.length === job.tasks.filter((f) => f.status === COMPLETED_STATUS).length) {
      job.status = COMPLETED_STATUS;
    }

    // Save the job
    await job.save();

    // Return the task
    res.body = job.tasks[taskIndex];
    next();
  } catch (err) {
    return next(err);
  }
})

/*
  Export the router
*/
module.exports = router;