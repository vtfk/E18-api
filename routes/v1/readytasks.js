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
    // Tasks that matches the criteria to be checked out
    let readyTasks = [];
    // Retreive the jobs
    let jobs = [];
    if(req.query.type) {
      jobs = await Job.find({
        status: { $ne: 'completed'},
        $and: [
          { 'tasks.status': { $ne: 'completed' }},
          { 'tasks.type': req.query.type }
        ]
      })
    } else {
      jobs = await Job.find({
        status: { $ne: 'completed'},
        'tasks.status': { $ne: 'competed' }
      })
    }

    // Just make double sure that the jobs are actually not completed
    jobs = jobs.filter((j) => j.status !== 'completed')

    // Determine if the tasks in the job matches the criteria to be checked out
    jobs.forEach((job) => {
      let collectedData = {}
      job.tasks.forEach((task, i) => {
        console.log('Checking index: ' + i);
        if(task.status === 'completed') {
          collectedData[task.type] = task.operations.find((o) => o.status === 'completed').data;
          return;
        } else if(task.status === 'running') {
          return;
        } else if(i !== 0 && job.tasks[i-1].status !== 'completed') {
          return;
        }
        // && job.tasks[-i].status !== 'completed'
        if(req.query.type) {
          if(req.query.type === task.type) {
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

    res.body = readyTasks;
    next();
  } catch (err) {
    return next(err);
  }
})

/*
  Export route
*/
module.exports = router;