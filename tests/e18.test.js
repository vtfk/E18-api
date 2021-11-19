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
  describe('POST: api/v1/jobs', () => {
    test('Valid Job', async () => {
      const body = require('./requests/post_job_valid')
      const response = await request(app).post('/api/v1/jobs').set(headers).send(body);
      expect(response.status).toBe(200);
      expect(response.body).not.toBeUndefined();
    })

    test('Valid self execution job', async () => {
      const body = require('./requests/post_job_valid externalExecution')
      const response = await request(app).post('/api/v1/jobs').set(headers).send(body);
      expect(response.status).toBe(200);
      expect(response.body).not.toBeUndefined();
    })

  })
})

afterAll(async () => {
  await db.disconnect();
})

