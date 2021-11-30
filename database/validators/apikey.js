/*
  Import dependencies
*/
const HTTPError = require('../../lib/vtfk-errors/httperror');

/**
 * Validates and sanitizes the apikey
 * @param {any} apikey
 * @returns
 */
function validate (apikey) {
    // Variables
    // Validate the name 
    if (!apikey.name) throw new HTTPError(400, 'name cannot be empty')
    // TODO Check for unique names? 

    return apikey
}

module.exports = validate