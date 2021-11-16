/*
  Import dependencies
*/
const createFilter = require('odata-v4-mongodb').createFilter
const HTTPError = require('../lib/vtfk-errors/httperror')

/**
 * Parses the req.query of a express request and
 * @param {*} query req.body.query
 * @returns {object} The found data
 */
exports.getMongooseTermsFromQuery = (query) => {
  const result = {}

  /// ////////////////////////////////////////////////////////////////////////
  // Query
  /// ////////////////////////////////////////////////////////////////////////
  result.query = {}
  if (query.dev) {
    result.dev = true
  } else {
    result.dev = false
  }

  /// ////////////////////////////////////////////////////////////////////////
  // Select
  /// ////////////////////////////////////////////////////////////////////////
  result.select = ''
  if (query.$select) {
    result.select = query.$select
  }

  /// ////////////////////////////////////////////////////////////////////////
  // Filter
  /// ////////////////////////////////////////////////////////////////////////
  result.filter = {}
  if (query.$filter) {
    // Regex for finding all filter values
    const regex = /'(.*?)'/gm
    // Find all filter values
    const matches = query.$filter.match(regex)
    // Fix forward slash
    if (Array.isArray(matches)) {
      matches.forEach((match) => {
        const fixed = match.replace(/\//g, '%2F')
        query.$filter = query.$filter.replace(match, fixed)
      })
    }

    try {
      result.filter = createFilter(query.$filter)
    } catch (err) {
      console.error(err)
      throw new HTTPError(400, 'Invalid $filter: ' + query.$filter.toString())
    }
  }

  /// ////////////////////////////////////////////////////////////////////////
  // Search
  /// ////////////////////////////////////////////////////////////////////////
  if (query.$search) {
    result.filter.$text = { $search: query.$search }
  }

  /// ////////////////////////////////////////////////////////////////////////
  // Sorting
  /// ////////////////////////////////////////////////////////////////////////
  result.$orderby = {} // The MongoDB orderby parameters
  result.sanitized_orderby = [] // Sanitized version of the $orderby sent by the client
  if (query.$orderby) {
    if (Array.isArray(query.$orderby)) {
      query.$orderby.forEach((sort) => {
        // Validation
        if (!sort) { return }
        if (sort.length <= 1) { return }
        // Type
        let type = 1 // Default is 1 = asc. 0 is desc
        // Trim the start and end of the sort
        sort = sort.trim()
        // Split the order by ' '
        const parts = sort.split(' ')
        if (parts.length < 2) throw new HTTPError(500, `$orderby by is not correctly formated: ${query.$orderby}`)
        // Get sort name
        const name = parts[0]
        if (parts[1] === 'desc') { type = -1 }
        result.$orderby[name] = type
        result.sanitized_orderby.push(sort)
      })
    }
  }

  /// ////////////////////////////////////////////////////////////////////////
  // Pagination
  /// ////////////////////////////////////////////////////////////////////////
  result.pagination = {}
  // Try to get the top from query params
  result.pagination.$top = 25
  if (query.$top !== undefined) {
    try {
      result.pagination.$top = parseInt(query.$top)
    } catch {}
  }
  // Try to get the page from query params
  result.pagination.$skip = 1
  if (query.$skip !== undefined) {
    try {
      result.pagination.$skip = parseInt(query.$skip)
    } catch {}
  }

  // Return the result
  return result
}

/**
 * Removes any occurance of a specified key in the object
 * @param {Object} obj
 * @param {String} key
 */
exports.removeKeys = (obj, key) => {
  for (const prop in obj) {
    if (prop === key) {
      delete obj[prop]
      return
    }
    if (typeof obj[prop] === 'object') this.removeKeys(obj[prop], key)
  }
}

exports.createPaginationForResponse = (req, skip, top, items, totalItems) => {
  const pagination = {
    $skip: skip,
    $top: top,
    items: items,
    totalItems: totalItems
  }
  // Calculate the last page
  if (totalItems === 0) { pagination.last_page = 1 } else if (top === 0) { pagination.last_page = 1 } else { pagination.last_page = Math.ceil(totalItems / top) }
  // Setup prev and next page if applicable
  if (pagination.$skip !== 1) { pagination.prev_page = pagination.$skip - 1 }
  if (pagination.$skip !== pagination.last_page) { pagination.next_page = pagination.$skip + 1 }

  const protocol = req.get('x-forwarded-proto') || req.protocol
  const fullUrl = protocol + '://' + req.get('host') + req.originalUrl
  const matchPattern = /page=\d/
  pagination.first_page_url = fullUrl.replace(matchPattern, 'page=1')
  pagination.last_page_url = fullUrl.replace(matchPattern, 'page=' + pagination.last_page)
  if (pagination.next_page) { pagination.next_page_url = fullUrl.replace(matchPattern, 'page=' + pagination.next_page) }
  if (pagination.prev_page) { pagination.prev_page_url = fullUrl.replace(matchPattern, 'page=' + pagination.prev_page) }

  return pagination
}

/**
 *
 * @param {Object} req Express req object
 * @param {Object} Model Mongoose model object
 * @param {Array} FieldsToRemove Array of any fields you want to remove
 * @param {Array} FieldsToRemoveStrict Array of any fields
 * @param {Array} FieldsToPopulate Array of fields that should be populated
 * @returns
 */
exports.requestDataByQuery = async (req, Model, FieldsToRemove = [], FieldsToPopulate = []) => {
  try {
  /// ////////////////////////////////////////////////////////////////
  // Parse the URL query
  /// ////////////////////////////////////////////////////////////////
    const query = this.getMongooseTermsFromQuery(req.query)

    /// ////////////////////////////////////////////////////////////////
    // Make filter case-insensitive
    /// ////////////////////////////////////////////////////////////////
    function makeFilterCaseInsensitive (part) {
      for (const obj in part) {
        if (typeof part[obj] === 'object') {
          makeFilterCaseInsensitive(part[obj])
        } else if (typeof part[obj] === 'string') {
          if (!obj.startsWith('$')) {
            part[obj] = { $regex: '^' + part[obj], $options: 'i' }
          }
        }
      }
    }
    await makeFilterCaseInsensitive(query.filter)

    /// ////////////////////////////////////////////////////////////////
    // Get the total number of incidents
    /// ////////////////////////////////////////////////////////////////
    let totalItems = 0
    totalItems = await Model.countDocuments(query.filter)

    /// ////////////////////////////////////////////////////////////////
    // Selects
    /// ////////////////////////////////////////////////////////////////
    // Add all selected properties that should not be ommited from the result
    let select = ''
    let selectArray = []

    // Add any selection fields that are not present in the removalarray to the selection array
    if (query.select && FieldsToRemove) selectArray = query.select.filter((i) => !FieldsToRemove.includes(i))

    // Add the fields to remove as exclusions if no selects are choosen. (MongoDB does not support both inclusion and exclusion in the same request)
    if (!query.select && FieldsToRemove) FieldsToRemove.forEach((item) => selectArray.push('-' + item.trim()))

    // Make the select-string and trim the ends
    select = selectArray.join(' ').trim()

    /// ////////////////////////////////////////////////////////////////
    // Population
    /// ////////////////////////////////////////////////////////////////
    const populate = ''
    if (FieldsToPopulate) FieldsToPopulate.filter((i) => selectArray.includes(i)).join(' ').trim()

    /// ////////////////////////////////////////////////////////////////
    // Get the data
    /// ////////////////////////////////////////////////////////////////
    let data = await Model
      .find(query.filter)
      .select(select)
      .limit(query.pagination.$top)
      .skip((query.pagination.$skip - 1) * query.pagination.$top)
      .sort(query.$orderby)
      .populate(populate)
      .exec()

    // Convert data to JSON to enable editing before sending the reponse
    data = JSON.parse(JSON.stringify(data))

    // Remove any keys if applicable
    if (FieldsToRemove) this.removeKeys(data, FieldsToRemove)

    // Determine pagination for the result
    const pagination = this.createPaginationForResponse(req, query.pagination.$skip, query.pagination.$top, data.length || 0, totalItems)

    // Setup metadata object
    const __metadata = {
      pagination
    }
    if (req.query.$select) __metadata.$select = req.query.$select.join(',').trim()
    if (req.query.$filter) __metadata.$filter = req.query.$filter
    if (req.query.$search) __metadata.$search = req.query.$search
    if (req.query.$orderby) __metadata.$filter = query.sanitized_orderby
    __metadata.timestamp = new Date()
    // Setup and return response
    const response = {
      __metadata,
      data
    }
    return response
  } catch (err) {
    return Promise.reject(err)
  }
}
