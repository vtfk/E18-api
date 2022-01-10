const { v4: uuid } = require('uuid')
const { get, list, remove, save } = require('@vtfk/azure-blob-client')

/**
 * Result from download blob
 * @typedef {Object} DownloadBlobResult
 * @property {string} fileName Name of the blob in the storage
 * @property {string} content Blob content
 */

/**
 * Options for upload content
 * @typedef {Object} UploadBlobOptions
 * @property {string} jobId The jobId of the linked job (if provided, will be created as a folder in blob storage)
 * @property {string} taskId The taskId of the linked job (if provided, will be created as a folder in blob storage)
 * @property {string} fileName The fileName for the content in blob storage (if not provided, a guid will be created)
 * @property {string} content Content to upload to blob storage
 */

/**
 * Options for upload content
 * @typedef {Object} DownloadBlobOptions
 * @property {string} jobId The jobId of the linked job (if provided, will be read as a folder in blob storage)
 * @property {string} taskId The taskId of the (if provided, will be read as a folder in blob storage)
 * @property {string} fileName The fileName for the content in blob storage
 */

/**
 * Options for delete blob
 * @typedef {Object} DeleteBlobOptions
 * @property {string} jobId The jobId of the linked job (if provided, will be read as a folder in blob storage)
 * @property {string} fileName The fileName for the content in blob storage
 */

/**
 * Upload content to blob storage
 * @param {UploadBlobOptions} options
 * @returns {Promise<String>} BlobName
 */
const uploadBlob = async options => {
  if (!options.jobId || !options.taskId) throw new Error('Both jobId and taskId must be provided for uploading file');
  if (!options.content) throw new Error('content must be provided for uploading files')
  const blobName = `${options.jobId}/${options.taskId}/` + (options.fileName || uuid());
  await save(blobName, JSON.stringify(options.content, null, 2))
  return blobName
}

/**
 * Download blob from blob storage
 * @param {DownloadBlobOptions} options
 * @returns {Promise<DownloadBlobResult>} DownloadBlobResult
 */
const downloadBlob = async options => {
  if (!options.jobId || !options.taskId) throw new Error('Both jobId and taskId must be provided for downloading file(s)');
  const blobName = `${options.jobId}/${options.taskId}/` + (options.fileName || uuid());
  const { data: content } = await get(blobName)
  return {
    fileName: blobName.split('/').pop(),
    content
  }
}

/**
 * Download all blobs in a folder from blob storage
 * @param {string} jobId The jobId to fetch blobs from
 * @returns {DownloadBlobResult[]} DownloadBlobResult[]
 */
const downloadFolder = async jobId => {
  const containerBlobs = await list(jobId)

  const blobs = []
  for await (const blob of containerBlobs) {
    const fileName = blob.name
    const path = blob.path.split('/')
    blobs.push(await downloadBlob({
      jobId: (path.length > 1 && path[0]) || jobId,
      taskId: (path.length > 2 && path[1]) || '',
      fileName
    }))
  }

  return blobs
}

/**
 * Delete blob from storage
 * @param {DeleteBlobOptions} options
 */
const deleteBlob = async blobName => {
  await remove(blobName)
}

/**
 * Delete all blobs in a folder. When all blobs are removed, the folder will automatically be removed
 * @param {string} jobId The jobId to remove blobs from
 */
const deleteFolder = async jobId => {
  const containerBlobs = await list(jobId)

  for await (const blob of containerBlobs) {
    await deleteBlob(blob.path)
  }
}

module.exports = {
  uploadBlob,
  downloadBlob,
  downloadFolder,
  deleteBlob,
  deleteFolder
}
