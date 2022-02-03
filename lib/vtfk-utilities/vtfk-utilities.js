/*
  Import dependencies
*/
const util = require('util')
const merge = require('lodash.merge');
const get = require('lodash.get');
const set = require('lodash.set');
const Sjablong = require('sjablong');

/*
  Functions
*/
exports.inspect = (obj) => {
  // Input validation
  if (!obj) { return }

  console.log(util.inspect(obj, true, 1000, true))
}

/**
 * Decodes base64 to a string
 * @param {string} encodedString
 * @returns
 */
exports.decodeBase64 = (encodedString) => {
  // Input validation
  if (!encodedString) { return }

  const buff = Buffer.from(encodedString, 'base64')
  return buff.toString('utf8')
}

/**
 * Takes in an object and ordered lists of how it's properties should be ordered
 * @param {Object} obj The object containing the keys/properties
 * @param {Array} startProperties A string array of what properties it should start with
 * @param {Array} endProperties A string array of what keys/properties it should end with
 * @returns
 */
exports.createObjectWithOrderedKeys = (obj, startProperties = [], endProperties = []) => {
  // Input validation
  if (!obj || typeof obj !== 'object') { throw new Error('The provided object is not of type object') }
  if (!startProperties || !Array.isArray(startProperties)) { throw new Error('startProperties is not of type Array') }
  if (!endProperties || !Array.isArray(endProperties)) { throw new Error('endProperties is not of type Array') }

  // Find all keys that are not matched
  const unmatchedKeys = Object.keys(obj).filter((key) => !startProperties.includes(key) && !endProperties.includes(key))

  // Combine all keys in order
  const orderedKeys = startProperties.concat(unmatchedKeys).concat(endProperties)

  // Construct a new object with the properties in order
  const newObj = {}
  orderedKeys.forEach((key) => {
    if (obj[key]) {
      newObj[key] = obj[key]
    }
  })

  // Return the new object
  return newObj
}

/**
 * Recursively removes any keys in the keys array from the object
 * Outputs a new object and does not modify the provided one
 * @param {Object} object
 * @param {[String]} keys
 */
exports.removeKeys = (object, keys) => {
  if (!object) return {}
  if (!keys) return object

  function _removeKeys (obj, keys, currentKey = undefined) {
    for (const prop in obj) {
      if (keys.includes(prop)) {
        delete obj[prop]
        continue;
      }
      if (typeof obj[prop] === 'object') {
        if (!Array.isArray(obj[prop])) _removeKeys(obj[prop], keys, prop);
        else obj[prop].forEach((i) => _removeKeys(i, keys));
      }
    }
  }

  const copy = JSON.parse(JSON.stringify(object))
  _removeKeys(copy, keys)
  return copy
}

exports.getTaskData = (mappings, collectedData, data) => {
  if (!mappings) return data
  if (collectedData === null || collectedData === undefined) return data
  if (typeof data !== 'object' || Array.isArray(data)) return data // Only perform merge on objects
  if (typeof collectedData !== 'object' || Array.isArray(collectedData)) return data // Only perform merge on objects

  if (mappings === '*') return merge(collectedData, data)
  if (!Array.isArray(mappings)) mappings = [mappings]

  let constructedData = {}
  mappings.forEach(mapping => {
    if (mapping === '*') {
      constructedData = merge(collectedData, data);
      return;
    }

    const mappingParts = mapping.split('=')
    if (mappingParts.length === 1) {
      const replaced = Sjablong.replacePlaceholders(mapping, collectedData);
      constructedData = merge(constructedData, JSON.parse(replaced));
    } else {
      console.log('HERE I AM');
      console.log('Path:', mapping);
      const propValue = get(collectedData, mappingParts[1])
      if (!propValue) return
      constructedData = set(constructedData, mappingParts[0], propValue)
    }
  })
  // Must do two mergings to retain the original key/prop order.
  // There is probably a more efficient way to do this.
  return merge(merge(data, constructedData), data)
}
