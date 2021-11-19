/*
    Import dependencies
*/
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` }) // Load different .env files based on NODE_ENV
const app = require('../app').app;
const request = require('supertest');
const db = require('../database/db');
const utilities = require('../lib/vtfk-utilities/vtfk-utilities');

/*
  Variables
*/
const headers = {
  'X-API-KEY': 'TEST',
  'Content-Type': 'application/json'
}


beforeAll(async (done) => {
  // Run the api;
  // console.log('Before all: ⏳ Waiting for database connectivity');
  // console.log('Before all: Mongoose ready state: ' + db.client.connection.readyState);
  // console.log('Before all: == Connection promise ==');
  // console.log(db.connectionPromise);
  await db.connect();
  // console.log('Should be connected now');
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
        expect(response.status).toBe(200);
        expect(response.body).not.toBeUndefined();
      })
    })
  })

  // Test with incomplete or invalid data
  describe('POST: api/v1/jobs - Invalid data', () => {
    const invalidExamples = require('./requests/post_job_invalid.js');
    for(let name in invalidExamples) {
      test(name, async () => {
        const body = invalidExamples[name];
        const response = await request(app).post('/api/v1/jobs').set(headers).send(body);
        expect(response.status).not.toBe(200);
      })
    }
  })

  describe('GET: api/v1/jobs', () => {
    let jobs = [];
    test('Get the two posted jobs', async () => {
      response = await request(app).get('/api/v1/jobs').set(headers).send();
      jobs = response.body.data;
      expect(response.status).toBe(200);
      expect(jobs.length).toBe(3);
    })

    test('Get the first job by id', async () => {
      response = await request(app).get('/api/v1/jobs/' + jobs[0]._id).set(headers).send();
      expect(response.status).toBe(200);
      expect(response.body).toBeTruthy();
    })
  })
})

afterAll(async () => {
  await db.disconnect();
})

