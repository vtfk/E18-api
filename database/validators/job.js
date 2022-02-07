/*
  Import dependencies
*/
const HTTPError = require('../../lib/vtfk-errors/httperror');

/**
 * Validates and sanitizes a job
 * @param {any} job
 * @returns
 */
function validate (job) {
  // Common validation


  // Checks if E18 is true
  if (job.e18 !== false) {
    if (!job.system) throw new HTTPError(400, 'system cannot be empty');
    // if (!job.type) throw new HTTPError(400, 'type must cannot be empty');
    if (job.projectId === undefined || job.projectId === null) throw new HTTPError(400, 'projectId cannot be empty when e18 is true');

    // Valiadte tasks
    if (!job.tasks) throw new HTTPError(400, 'tasks cannot be empty when e18 is true');
    if (!Array.isArray(job.tasks) || job.tasks.length === 0) throw new HTTPError(400, 'tasks cannot be empty when e18 is true');
    let taskIndex = -1;
    job.tasks.forEach((task) => {
      taskIndex++;

      // Check if the task for some reason has gotten in as type function
      if (task.data && typeof task.data === 'function') throw new HTTPError(400, 'Task data cannot be of type \'function\'');

      // Check datamapping
      if (task.dataMapping) {
        const dataMapping = Array.isArray(task.dataMapping) ? task.dataMapping : [task.dataMapping];
        let mappingIndex = -1;
        dataMapping.forEach((mapping) => {
          mappingIndex++;
          if (mapping === '*') return;
          if (!mapping.includes('=')) {
            try { JSON.parse(mapping); } catch (err) { throw new Error(`Invalid datamapping for task at index ${taskIndex} : mapping index ${mappingIndex} : ${mapping} : ${err.message}`); }
          }
        })
      }
    })
  } else { // If E18 is explicitly set false
    // Set some default values
    job.parallel = false;
    // Remove any unesessary/unsupported information from the task
    if (job.tasks) {
      job.tasks.forEach((task) => {
        if (task.data) delete task.data;
        if (task.files) delete task.files;
      })
    }
  }

  return job;
}

/**
 *
 * @param {any} job The job object to check
 */
function isMissingOrLocked (id, job) {
  const lockedStatuses = ['completed', 'retired', 'suspended']
  if (!job) throw new HTTPError(404, `The job with id ${id} could not be found`);
  if (!job.status) throw new HTTPError(500, `Could not determine the status of job '${id}'`);
  const match = lockedStatuses.find((i) => i === job.status);
  if (match) throw new HTTPError(400, `The job is locked with status'${match}'`);
}

module.exports = {
  validate,
  isMissingOrLocked
}
