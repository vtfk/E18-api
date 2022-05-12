const mongoose = require('mongoose')

module.exports.taskSystems = ['p360', 'svarut']
module.exports.operationStatuses = ['completed', 'failed']
module.exports.comment = new mongoose.Schema({
  user: { type: String, required: true },
  message: { type: String, required: true }
})
