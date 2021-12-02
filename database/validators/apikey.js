/*
  Import dependencies
*/
const HTTPError = require('../../lib/vtfk-errors/httperror');
const ApiKeys = require('../db').ApiKeys

/**
 * Validates and sanitizes the apikey
 * @param {any} apikey
 * @returns
 */
async function validate (apikey) {
  // Validate the name
  if (!apikey.name) throw new HTTPError(400, 'name cannot be empty')
  // Check if name is unique

  const existingName = await ApiKeys.findOne({ name: { $regex: apikey.name, $options: 'ig' } })
  if (existingName) throw new HTTPError(400, 'name must be unique')
  return apikey
}

module.exports = validate
