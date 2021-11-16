/*
  Import dependencies
*/
const createFilter = require('odata-v4-mongodb').createFilter;

/**
 * Parses the req.query of a express request and
 * @param {*} query req.body.query
 * @returns {object} The found data
 */
 exports.getMongooseTermsFromQuery = (query) => {
  let result = {}

  ///////////////////////////////////////////////////////////////////////////
  // Query
  ///////////////////////////////////////////////////////////////////////////
  result.query = {};
  if(query.dev) {
      result.dev = true;
  } else {
      result.dev = false;
  }

  ///////////////////////////////////////////////////////////////////////////
  // Select
  ///////////////////////////////////////////////////////////////////////////
  result.select = '';
  if(query.$select) {
      result.select = query.$select;
  }

  ///////////////////////////////////////////////////////////////////////////
  // Filter
  ///////////////////////////////////////////////////////////////////////////
  result.filter = {};
  if(query.$filter) {
      // Regex for finding all filter values
      let regex = /'(.*?)'/gm
      // Find all filter values
      let matches = query.$filter.match(regex);
      // Fix forward slash
      if(Array.isArray(matches)) {
          matches.forEach((match) => {
              let fixed = match.replace(/\//g, '%2F');
              query.$filter = query.$filter.replace(match, fixed)
          })
      }
      
      try {
          result.filter = createFilter(query.$filter)
      } catch(err) {
          console.error(err);
          throw {
              status: 500,
              message: 'Invalid $filter: ' + query.$filter.toString()
          }
      }
  }

  ///////////////////////////////////////////////////////////////////////////
  // Search
  ///////////////////////////////////////////////////////////////////////////
  if(query.$search) {
      result.filter['$text'] = {'$search': query.$search}
  }

  ///////////////////////////////////////////////////////////////////////////
  // Sorting
  ///////////////////////////////////////////////////////////////////////////
  result.$orderby = {};           // The MongoDB orderby parameters
  result.sanitized_orderby = [];  // Sanitized version of the $orderby sent by the client
  if(query.$orderby) {
      if(Array.isArray(query.$orderby)) {
          query.$orderby.forEach((sort) => {
              // Validation
              if(!sort) { return; }
              if(sort.length <= 1) { return; }
              // Type
              let type = 1; // Default is 1 = asc. 0 is desc
              // Trim the start and end of the sort
              sort = sort.trim();
              // Split the order by ' '
              let parts = sort.split(' ');
              if(parts.length < 2) { throw { status: 500, message: '$orderby by is not correctly formated: ' + query.$orderby}}
              // Get sort name
              let name = parts[0]
              if(parts[1] == 'desc') { type = -1; }
              result.$orderby[name] = type;
              result.sanitized_orderby.push(sort);
          })
      }
  }

  ///////////////////////////////////////////////////////////////////////////
  // Pagination
  ///////////////////////////////////////////////////////////////////////////
  result.pagination = {};
  // Try to get the top from query params
  result.pagination.$top = 25;
  if(query.$top !== undefined) {
      try {
          result.pagination.$top = parseInt(query.$top);
      } catch {}
  }
  // Try to get the page from query params
  result.pagination.$skip = 1;
  if(query.$skip !== undefined) {
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
  for (var prop in obj) {
    if(prop == key) {
      delete obj[prop];
      return;
    }
    if(typeof obj[prop] === 'object') this.removeKeys(obj[prop], key);
  }
}

exports.createPaginationForResponse = (req, skip, top, items, total_items) => {
  let pagination = {
      $skip: skip,
      $top: top,
      items: items,
      total_items: total_items,
  };
  // Calculate the last page
  if(total_items == 0) { pagination.last_page = 1 }
  else if(top == 0) { pagination.last_page = 1 }
  else { pagination.last_page = Math.ceil(total_items / top) }
  // Setup prev and next page if applicable
  if(pagination.$skip != 1) { pagination.prev_page = pagination.$skip - 1 }
  if(pagination.$skip != pagination.last_page) { pagination.next_page = pagination.$skip + 1 }

  let protocol = req.get('x-forwarded-proto') || req.protocol
  var fullUrl = protocol + '://' + req.get('host') + req.originalUrl;
  let match_pattern = /page=\d/
  pagination.first_page_url = fullUrl.replace(match_pattern, 'page=1');
  pagination.last_page_url = fullUrl.replace(match_pattern, 'page=' + pagination.last_page);
  if(pagination.next_page) { pagination.next_page_url = fullUrl.replace(match_pattern, 'page=' + pagination.next_page); }
  if(pagination.prev_page) { pagination.prev_page_url = fullUrl.replace(match_pattern, 'page=' + pagination.prev_page); }

  return pagination;
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
  return new Promise(async (resolve, reject) => {
      try {
          ///////////////////////////////////////////////////////////////////
          // Parse the URL query
          ///////////////////////////////////////////////////////////////////
          let query = this.getMongooseTermsFromQuery(req.query);

          ///////////////////////////////////////////////////////////////////
          // Make filter case-insensitive
          ///////////////////////////////////////////////////////////////////
          function make_filter_ci(part) {
              for(let obj in part) {
                  if(typeof part[obj] == 'object') {
                      make_filter_ci(part[obj]);
                  } else if (typeof part[obj] == 'string') {
                          if(!obj.startsWith('$')) {
                          part[obj] = { "$regex": "^" + part[obj], "$options": 'i'}
                      }
                  }
              }
          }
          await make_filter_ci(query.filter);

          ///////////////////////////////////////////////////////////////////
          // Get the total number of incidents
          ///////////////////////////////////////////////////////////////////
          let total_items = 0;
          total_items = await Model.countDocuments(query.filter) 

          ///////////////////////////////////////////////////////////////////
          // Selects
          ///////////////////////////////////////////////////////////////////
          // Add all selected properties that should not be ommited from the result
          var select = ''
          var select_array = [];

          // Add any selection fields that are not present in the removalarray to the selection array
          if(query.select && FieldsToRemove) select_array = query.select.filter((i) => !FieldsToRemove.includes(i))

          // Add the fields to remove as exclusions if no selects are choosen. (MongoDB does not support both inclusion and exclusion in the same request)
          if(!query.select && FieldsToRemove) FieldsToRemove.forEach((item) => select_array.push('-' + item.trim()))
          
          // Make the select-string and trim the ends
          select = select_array.join(' ').trim();
          
          ///////////////////////////////////////////////////////////////////
          // Population
          ///////////////////////////////////////////////////////////////////
          var populate = '';
          if(FieldsToPopulate)  FieldsToPopulate.filter((i) => select_array.includes(i)).join(' ').trim();

          ///////////////////////////////////////////////////////////////////
          // Get the data
          ///////////////////////////////////////////////////////////////////
          await Model
          .find(query.filter)
          .select(select)
          .limit(query.pagination.$top)
          .skip((query.pagination.$skip - 1) * query.pagination.$top)
          .sort(query.$orderby)
          .populate(populate)
          .exec((err, data) => {
              try {
                  // Handle any errors
                  if(err) { return reject(err) }
                  // Convert data to JSON to enable editing before sending the reponse
                  data = JSON.parse(JSON.stringify(data));
                  // Remove any keys if applicable
                  if(FieldsToRemove) this.removeKeys(data, FieldsToRemove)
                  // Determine pagination for the result
                  let pagination = this.createPaginationForResponse(req, query.pagination.$skip, query.pagination.$top, data.length || 0, total_items)
                  // Setup metadata object
                  let _metadata = {
                    pagination
                  }
                  if(req.query.$select) _metadata['$select'] = req.query.$select.join(',').trim();
                  if(req.query.$filter) _metadata['$filter'] = req.query.$filter
                  if(req.query.$search) _metadata['$search'] = req.query.$search
                  if(req.query.$orderby) _metadata['$filter'] = query.sanitized_orderby;
                  _metadata.timestamp = new Date();
                  // Setup and return response
                  let response = {
                      _metadata,
                      data
                  }
                  return resolve(response);
              } catch (err) {
                  return reject(err);
              }
          })
      } catch (err) {
          return reject(err);
      }
  })

}