const { BlobServiceClient } = require('@azure/storage-blob')
const { saConnectionString, saBlobName } = require('../config')
const { v4: uuid } = require('uuid')

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
 * @property {string} content Content to upload to blob storage
 * @property {string} fileName The fileName for the content in blob storage (if not provided, a guid will be created)
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

const getBlobContainer = () => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(saConnectionString)
  return blobServiceClient.getContainerClient(saBlobName)
}

const getContainerBlobs = jobId => {
  const containerClient = getBlobContainer()
  return containerClient.listBlobsFlat({
    prefix: jobId
  })
}

async function streamToBuffer (readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

/**
 * Upload content to blob storage
 * @param {UploadBlobOptions} options
 * @returns {String} BlobName
 */
const uploadBlob = async options => {
  const containerClient = getBlobContainer()
  const blobName = `${options.jobId ? `${options.jobId}/` : ''}${options.fileName || uuid()}`
  const blockBlobClient = containerClient.getBlockBlobClient(blobName)
  await blockBlobClient.upload(options.content, options.content.length)
  return blobName
}

/**
 * Download blob from blob storage
 * @param {DownloadBlobOptions} options
 * @returns {Promise<DownloadBlobResult>} DownloadBlobResult
 */
async function downloadBlob (options) {
  const containerClient = getBlobContainer()
  let blobName = '';
  if (options.jobId) blobName += `${options.jobId}/`
  if (options.taskId) blobName += `${options.taskId}/`
  blobName += options.fileName;

  const blobClient = containerClient.getBlobClient(blobName)
  const downloadResponse = await blobClient.download()
  let content = (await streamToBuffer(downloadResponse.readableStreamBody)).toString();

  content = content.toString();
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
  const containerBlobs = getContainerBlobs(jobId)

  const blobs = []
  for await (const blob of containerBlobs) {
    const fileName = blob.name.split('/').pop()
    blobs.push(await downloadBlob({
      jobId,
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
  const containerClient = getBlobContainer()
  const blobClient = containerClient.getBlockBlobClient(blobName)

  await blobClient.delete()
}

/**
 * Delete all blobs in a folder. When all blobs are removed, the folder will automatically be removed
 * @param {string} jobId The jobId to remove blobs from
 */
const deleteFolder = async jobId => {
  const containerBlobs = getContainerBlobs(jobId)

  for await (const blob of containerBlobs) {
    await deleteBlob(blob.name)
  }
}

module.exports = {
  uploadBlob,
  downloadBlob,
  downloadFolder,
  deleteBlob,
  deleteFolder
}
