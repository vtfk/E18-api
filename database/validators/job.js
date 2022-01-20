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
  // Variables
  const taskTypes = []          // Array for all unique task types
  const dependencyTags = []     // Array for all unique dependencyTags
  const dependencies = []       // Array for all unique dependencies

  // Checks if E18 is true
  if (job.e18 !== false) {
    if (!job.system) throw new HTTPError(400, 'system cannot be empty when e18 is true');
    if (job.projectId === undefined || job.projectId === null) throw new HTTPError(400, 'projectId cannot be empty when e18 is true');
    // Valiadte tasks
    if (!job.tasks) throw new HTTPError(400, 'tasks cannot be empty when e18 is true');
    if (!Array.isArray(job.tasks) || job.tasks.length === 0) throw new HTTPError(400, 'tasks cannot be empty when e18 is true');
    let taskIndex = -1;
    job.tasks.forEach((task) => {
      taskIndex++;
      // If the task should be processed by E18, but no data has been provided
      // if (!task.data || typeof task.data !== 'object' || Object.keys(task.data).length <= 0) throw new HTTPError(400, 'Data must be provided on all tasks for E18 to process them');
      // Make dependencyTag checks
      if (task.dependencyTag) {
        // Task cannot have dependency tag when there is only a single task
        if (job.tasks.length === 1) throw new HTTPError(400, 'DependencyTag cannot be set when there is only a single task');
        // Task cannot be dependent on it self
        if (task.dependencies && task.dependencies.includes(task.dependencyTag)) throw new HTTPError(400, 'Task cannot have it self as a dependency');
        // Add the dependencyTag to the dependencyTagsArray if not already present
        if (!dependencyTags.includes(task.dependencyTag)) dependencyTags.push(task.dependencyTag)
      }
      // Make dependencies check
      if (task.dependencies) {
        // If task has dependencies, but there are no other tasks
        if (job.tasks.length === 1) throw new HTTPError(400, 'Task cannot have dependencies when there are no other tasks');
        // Check if there are more dependencies than there are tasks
        if (task.dependencies.length > job.tasks.length) throw new HTTPError(400, 'There cannot be more dependencies than there are tasks');
        // Add any dependencies to the array that have not been previously added
        task.dependencies.forEach((d) => {
          if (!dependencies.includes(d)) dependencies.push(d);
        })
      }
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

      // Add tasktype to taskTypes if not previously found
      if (!taskTypes.includes(task.type)) taskTypes.push(task.type)
    })

    /*
      Validate the dependencies
    */
    // If the number of unique dependency tags and dependencies don't match up something is wrong
    if (dependencyTags.length !== dependencies.length) throw new HTTPError(400, 'There is a mismatch between dependencyTags and dependencies');

    // Make sure that all the specified dependecytags has been used by the dependencies
    if (dependencyTags.length > 0) {
      dependencyTags.forEach((tag) => {
        const match = dependencies.find((d) => dependencyTags.includes(d));
        if (!match) throw new HTTPError(400, `The dependency tags ${tag} is set but not used`)
      })
    }

    // Make sure that all dependencies has a correlating tag
    if (dependencies.length > 0) {
      dependencies.forEach((dependency) => {
        const match = dependencyTags.find((t) => dependencies.includes(t));
        if (!match) throw new HTTPError(400, `The dependency ${dependency} is used, but has not been set`)
      })
    }
  } else { // If E18 is explicitly set false
    // Set some default values
    job.parallel = false;
    // Remove any unesessary/unsupported information from the task
    if (job.tasks) {
      job.tasks.forEach((task) => {
        if (task.dependencyTag) delete task.dependencyTag;
        if (task.dependencies) delete task.dependencies;
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
  if (!job.status) throw new HTTPError(404, `Could not determine the status of job '${id}'`);
  const match = lockedStatuses.find((i) => i === job.status);
  if (match) throw new HTTPError(404, `The job is locked with status'${match}'`);
}

module.exports = {
  validate,
  isMissingOrLocked
}
