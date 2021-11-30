/*
  Import dependencies
*/
const express = require('express')
const router = express.Router()
const ApiKeys = require('../../database/db').ApiKeys
const dbTools = require('../../database/db.tools.js')
const HTTPError = require('../../lib/vtfk-errors/httperror');
const validateAPIKey = require('../../database/validators/apikey')

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
    const apikey = validateAPIKey(req.body);

    // Create and return the apikey
    res.body = await ApiKeys.create(apikey)
    next()
  } catch (err) {
    return next(err)
  }
})

// GET apikey by id
router.get('/:id', async (req, res, next) => {
  try {
    let result = await ApiKeys.findById(req.params.id);

    if (!result) throw new HTTPError(404, 'ApiKey not found in the database');

    res.body = result;
    next()
  } catch (err) {
    return next(err)
  }
})

// Delete apikey by id
router.delete('/:id', async (req, res, next) => {
  try {
    console.log(req.params.id)
    if (!req.params.id) throw new HTTPError(404, 'ApiKey not found in the database, cannot delete something that is not found');

    let result = await ApiKeys.findByIdAndDelete(req.params.id);

    if (result){
      console.log(`API-Key with the ID - ${req.params.id} is deleted.`)
    } 

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