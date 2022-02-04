/*
    Import dependencies
*/
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` }) // Load different .env files based on NODE_ENV
const app = require('../app').app;
const request = require('supertest');
const db = require('../database/db');

/*
  Variables
*/
let jobs = [];
const headers = {
  'X-API-KEY': '876b7452-6321-41c9-8e9f-c0f1c963f491',
  'Content-Type': 'application/json'
}

/*
  Functions
*/
function outputError (response) {
  if (!response || !response.status || !response.body) return;
  if (parseInt(response.status) < 299) return;
  console.error(response.body);
}

/*
  Run before Jest tests
*/
beforeAll(async (done) => {
  await db.connect();
  done();
});

/*
  Tests
*/
// Jobs
describe('Test all jobs endpoint', () => {
  // Test with complete data
  describe('POST: api/v1/jobs - Valid data', () => {
    const examples = require('./requests/post_job_valid.js');
    examples.forEach((example) => {
      test(example.description, async () => {
        const response = await request(app).post('/api/v1/jobs').set(headers).send(example.data);
        outputError(response);

        expect(response.status).toBe(200);
        expect(response.body).not.toBeUndefined();
      })
    })
  })

  // Test with incomplete or invalid data
  describe('POST: api/v1/jobs - Invalid data', () => {
    const invalidExamples = require('./requests/post_job_invalid.js');
    invalidExamples.forEach((example) => {
      test(example.description, async () => {
        const response = await request(app).post('/api/v1/jobs').set(headers).send(example.data);
        expect(response.status).not.toBe(200);
        expect(response.body).not.toBeUndefined();
      })
    })
  })

  describe('GET: api/v1/jobs', () => {
    test('Check that jobs has been posted', async () => {
      const response = await request(app).get('/api/v1/jobs').set(headers).send();
      jobs = response.body.data;
      outputError(response);
      expect(response.status).toBe(200);
      expect(jobs.length).toBeGreaterThan(0);
    })

    test('Get the first job by id', async () => {
      const response = await request(app).get('/api/v1/jobs/' + jobs[0]._id).set(headers).send();
      outputError(response);
      expect(response.status).toBe(200);
      expect(response.body).toBeTruthy();
    })
  })

  describe('POST: api/v1/jobs/:id/tasks', () => {
    const validExamples = require('./requests/post_task_valid.js');
    validExamples.forEach((example) => {
      test(example.description, async () => {
        const e18Job = jobs.find((j) => j.e18 === example.e18);
        const response = await request(app).post(`/api/v1/jobs/${e18Job._id}/tasks`).set(headers).send(example.data);
        outputError(response);
        expect(response.status).toBe(200);
        expect(response.body).not.toBeUndefined();
      })
    })
  })

  describe('POST: api/v1/jobs/:id/tasks - Invalid data', () => {
    const invalidExamples = require('./requests/post_task_invalid.js');
    invalidExamples.forEach((example) => {
      test(example.description, async () => {
        const e18Job = jobs.find((j) => j.e18 === example.e18);
        const response = await request(app).post(`/api/v1/jobs/${e18Job._id}/tasks`).set(headers).send(example.data);
        expect(response.status).toBe(400);
        expect(response.body).not.toBeUndefined();
      })
    })
  })
})

describe('Test job life-cycles', () => {
  describe('Test a simple job', () => {
    const job = {
      system: 'e18-test',
      projectId: 0,
      type: 'test',
      tasks: [
        {
          system: 'test',
          method: 'test'
        },
        {
          system: 'test2',
          method: 'test2'
        }
      ]
    }

    test('Dropping collections', async () => {
      await db.Job.collection.drop();
      let response = await request(app).get('/api/v1/jobs').set(headers).send();
      expect(response.body.data.length).toBe(0);
      await db.Statistic.collection.drop();
      response = await request(app).get('/api/v1/statistics').set(headers).send();
      expect(response.body.data.length).toBe(0);
    })

    test('Post job', async () => {
      expect(async () => { await request(app).post('/api/v1/jobs').set(headers).send(job) }).not.toThrow();
    })

    let firstTask;
    test('Checkout the first task', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send(job);
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('running');
      firstTask = response.body[0];
    })

    test('Post completed operation to the task', async () => {
      const req = { status: 'completed' }
      const response = await request(app).post(`/api/v1/jobs/${firstTask.jobId}/tasks/${firstTask._id}/operations`).set(headers).send(req);
      expect(response.status).toBe(200);
    })

    test('Checkout the last task and post failed operation', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('running');
      expect(response.body[0]._id).not.toBe(firstTask._id);

      const req = { status: 'failed' }
      const res2 = await request(app).post(`/api/v1/jobs/${response.body[0].jobId}/tasks/${response.body[0]._id}/operations`).set(headers).send(req);
      expect(res2.status).toBe(200);
    })

    test('Retreive the last task again and post a successfull operation', async () => {
      const req = { status: 'completed' }
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send(req);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('running');
      expect(response.body[0]._id).not.toBe(firstTask._id);
      expect(response.body[0].operations.length).toBe(1);

      const res2 = await request(app).post(`/api/v1/jobs/${response.body[0].jobId}/tasks/${response.body[0]._id}/operations`).set(headers).send({ status: 'completed' });
      expect(res2.status).toBe(200);
    })

    test('Make sure that there are no more ready tasks', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    })

    test('Posting operation to completed task should fail', async () => {
      const response = await request(app).post(`/api/v1/jobs/${firstTask.jobId}/tasks/${firstTask._id}/operations`).set(headers).send({ status: 'completed' });
      expect(response.status).toBe(400);
    })

    test('The job should have gotten status completed', async () => {
      const response = await request(app).get('/api/v1/jobs').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('completed');
      expect(response.body.data[0].tasks[1].retries).toBe(1);
    })

    test('Run maintenance', async () => {
      const response = await request(app).post('/api/v1/statistics/maintain').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.transferedEntries).toBe(1);
    })

    test('The job collection should be empty and statistics should have one', async () => {
      let response = await request(app).get('/api/v1/jobs').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);

      response = await request(app).get('/api/v1/statistics').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    })
  })

  describe('Test a parallel job with three tasks', () => {
    const job = {
      system: 'e18',
      type: 'test',
      projectId: 0,
      parallel: true,
      tasks: [
        {
          system: 'e18',
          method: 'test1'
        },
        {
          system: 'e18',
          method: 'test2'
        },
        {
          system: 'e18',
          method: 'test3'
        }
      ]
    }

    test('Dropping collections', async () => {
      await db.Job.collection.drop();
      let response = await request(app).get('/api/v1/jobs').set(headers).send();
      expect(response.body.data.length).toBe(0);
      await db.Statistic.collection.drop();
      response = await request(app).get('/api/v1/statistics').set(headers).send();
      expect(response.body.data.length).toBe(0);
    })

    test('Post the job', async () => {
      const response = await request(app).post('/api/v1/jobs').set(headers).send(job);
      expect(response.status).toBe(200);
    })

    let tasks;
    test('Checkout the tasks', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send(job);
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
      expect(response.body[0].status).toBe('running');
      tasks = response.body;
    })

    test('Post successfull operation to tasks', async () => {
      for (const task of tasks) {
        const response = await request(app).post(`/api/v1/jobs/${task.jobId}/tasks/${task._id}/operations`).set(headers).send({ status: 'completed' });
        expect(response.status).toBe(200);
      }
    })

    test('readyTasks should be empty', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send(job);
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    })
  })

  describe('Test job with grouped tasks ( 1 : 2 : 3 : 1 )', () => {
    const job = {
      system: 'e18',
      type: 'test',
      projectId: 0,
      tasks: [
        {
          system: 'e18',
          method: 'test'
        },
        {
          system: 'e18',
          method: 'test',
          group: 'group1'
        },
        {
          system: 'e18',
          method: 'test',
          group: 'group1'
        },
        {
          system: 'e18',
          method: 'test',
          group: 'group2'
        },
        {
          system: 'e18',
          method: 'test',
          group: 'group2'
        },
        {
          system: 'e18',
          method: 'test',
          group: 'group2'
        },
        {
          system: 'e18',
          method: 'test'
        }
      ]
    }

    test('Post job', async () => {
      const response = await request(app).post('/api/v1/jobs').set(headers).send(job)
      expect(response.status).toBe(200);
    })

    test('Get first task and complete it', async () => {
      let response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send(job);
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('running');

      response = await request(app).post(`/api/v1/jobs/${response.body[0].jobId}/tasks/${response.body[0]._id}/operations`).set(headers).send({ status: 'completed' });
      expect(response.status).toBe(200);
    })

    test('Get group1 and complete them', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send(job);
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);

      for (const task of response.body) {
        expect(task.status).toBe('running');
        expect(task.group).toBe('group1');
        const res = await request(app).post(`/api/v1/jobs/${task.jobId}/tasks/${task._id}/operations`).set(headers).send({ status: 'completed' });
        expect(res.status).toBe(200);
      }
    })

    test('Get group2: complete 1 and 3, fail 2', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);

      let taskIndex = -1;
      for (const task of response.body) {
        taskIndex++;

        expect(task.status).toBe('running');
        expect(task.group).toBe('group2');
        let res;
        if (taskIndex === 1) res = await request(app).post(`/api/v1/jobs/${task.jobId}/tasks/${task._id}/operations`).set(headers).send({ status: 'failed' });
        else res = await request(app).post(`/api/v1/jobs/${task.jobId}/tasks/${task._id}/operations`).set(headers).send({ status: 'completed' });
        expect(res.status).toBe(200);
      }
    })

    test('Checkout the failed group2 task and complete it', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].group).toBe('group2');
      const res = await request(app).post(`/api/v1/jobs/${response.body[0].jobId}/tasks/${response.body[0]._id}/operations`).set(headers).send({ status: 'completed' });
      expect(res.status).toBe(200);
    })

    test('Checkout the last task and complete it', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].group).toBeFalsy();
      const res = await request(app).post(`/api/v1/jobs/${response.body[0].jobId}/tasks/${response.body[0]._id}/operations`).set(headers).send({ status: 'completed' });
      expect(res.status).toBe(200);
    })

    test('ReadyTasks should be empty now', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    })
  })

  describe('Testing jobs with data mapping', () => {
    const job = {
      system: 'e18',
      type: 'test',
      projectId: 0,
      tasks: [
        {
          system: 'e18',
          method: 'test'
        },
        {
          system: 'e18',
          method: '1:1 mapping',
          dataMapping: ['test1=test1', 'levelone.leveltwo.levelthree=level1.level2.level3']
        },
        {
          system: 'e18',
          method: 'template mapping',
          dataMapping: '{"test":{"test1":"{{test1}}","test2":"{{test2}}"}}'
        },
        {
          system: 'e18',
          method: 'full mapping',
          dataMapping: '*'
        }
      ]
    }

    test('Post job', async () => {
      const response = await request(app).post('/api/v1/jobs').set(headers).send(job)
      expect(response.status).toBe(200);
    })

    test('Checkout and post operation with test-data to first task', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      const data = {
        test1: 'test1',
        level1: {
          level2: {
            level3: 'leveltest'
          }
        }
      }
      const res = await request(app).post(`/api/v1/jobs/${response.body[0].jobId}/tasks/${response.body[0]._id}/operations`).set(headers).send({ status: 'completed', data: data });
      expect(res.status).toBe(200);
    })

    test('Checkout next task, test 1:1 datamapping and post operation with more data', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].data.test1).toBe('test1');
      expect(response.body[0].data.levelone.leveltwo.levelthree).toBe('leveltest');
      const res = await request(app).post(`/api/v1/jobs/${response.body[0].jobId}/tasks/${response.body[0]._id}/operations`).set(headers).send({ status: 'completed', data: { test2: 'test2' } });
      expect(res.status).toBe(200);
    })

    test('Checkout next task, test template datamapping and post operation with more data', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].data.test.test1).toBe('test1');
      expect(response.body[0].data.test.test2).toBe('test2');
      const res = await request(app).post(`/api/v1/jobs/${response.body[0].jobId}/tasks/${response.body[0]._id}/operations`).set(headers).send({ status: 'completed', data: { test3: 'test3' } });
      expect(res.status).toBe(200);
    })

    test('Checkout last task, test wildcard datamapping and post operation', async () => {
      const response = await request(app).get('/api/v1/readyTasks?checkout=true').set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].data.test1).toBe('test1');
      expect(response.body[0].data.test2).toBe('test2');
      expect(response.body[0].data.test3).toBe('test3');
      expect(response.body[0].data.level1.level2.level3).toBe('leveltest');
      const res = await request(app).post(`/api/v1/jobs/${response.body[0].jobId}/tasks/${response.body[0]._id}/operations`).set(headers).send({ status: 'completed' });
      expect(res.status).toBe(200);
    })
  })
})

afterAll(async () => {
  await db.disconnect();
})
