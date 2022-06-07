/*
  Import dependencies
*/
const express = require('express')
const router = express.Router()
const ApiKeys = require('../../database/db').ApiKeys
const dbTools = require('../../database/db.tools.js')
const HTTPError = require('../../lib/vtfk-errors/httperror');
const validateAPIKey = require('../../database/validators/apikey')
const crypto = require('crypto')

/*
  Define something
*/
let plainAPIKey = ''

/*
  Routes
*/
// GET
router.get('/', async (req, res, next) => {
  try {
    const keys = await dbTools.requestDataByQuery(req, ApiKeys)
    res.body = keys
    next()
  } catch (err) {
    return next(err)
  }
})

// POST
router.post('/', async (req, res, next) => {
  try {
    // Validate and sanitize the apikey
    await validateAPIKey(req.body);

    /*
      Generate UUID
    */
    function randomIntFromInterval (min, max) { // min and max included
      return Math.floor(Math.random() * (max - min + 1) + min)
    }
    function generateKey () {
      let key = '';

      const specialCharacters = ['!', '%', '#', '&', '(', ')', '='];
      const lowercase = [...Array(26)].map((val, i) => String.fromCharCode(i + 97));
      const uppercase = [...Array(26)].map((val, i) => String.fromCharCode(i + 65));

      const allCharacters = [...specialCharacters, ...lowercase, ...uppercase];

      for (let i = 0; i < 123; i++) {
        key += allCharacters[randomIntFromInterval(0, allCharacters.length - 1)];
      }

      return key
    }
    /*
      Define the API-Key with the UUID
    */
    plainAPIKey = generateKey()

    // Hash the api key
    const hash = crypto.createHash('sha512').update(plainAPIKey).digest('hex')

    const APIKey = {
      name: req.body.name,
      enabled: true,
      hash: hash
    }

    await ApiKeys.create(APIKey);

    // Create and return the apikey
    if (req.query.fullitem) {
      res.body = await ApiKeys.findOne({ name: APIKey.name})
    } else {
      res.body = {
        name: req.body.name,
        key: plainAPIKey
      }
    }

    return next();
  } catch (err) {
    return next(err)
  }
})

// GET apikey by id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await ApiKeys.findById(req.params.id);

    if (!result) throw new HTTPError(404, 'ApiKey not found in the database');

    res.body = result;
    next()
  } catch (err) {
    return next(err)
  }
})

// Update apikey by id
router.put('/:id', async (req, res, next) => {
  try {
    // Update the job
    res.body = await ApiKeys.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // Return
    next();
  } catch (err) {
    next(err);
  }
})

// Delete apikey by id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!req.params.id) throw new HTTPError(404, 'ApiKey not found in the database, cannot delete something that is not found');

    const result = await ApiKeys.findByIdAndDelete(req.params.id);

    res.body = result;
    next()
  } catch (err) {
    return next(err)
  }
})

/*
  Export the router
*/
module.exports = router
