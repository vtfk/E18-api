# E18-api

## Usage

For local development create a `.env.development` file
```bash
DBCONNECTIONSTRING=mongodb+srv://<username>:<password>@<mongoHost>?retryWrites=true&w=majority
AZURE_BLOB_CONNECTIONSTRING=get-connection-string-from-access-keys-on-your-storage-account
AZURE_BLOB_CONTAINERNAME=files
```

## Blob storage

Create a storage account in your resource group.

Create a blob container with the name specified in `AZURE_BLOB_CONTAINERNAME`

Set `AZURE_BLOB_CONNECTIONSTRING` as the **Connection string** found in `Access keys` in your storage account

### Usage

#### Upload blob

**Request**
```javascript
const { uploadBlob } = require('./blob-storage')
try {
  const result = await uploadBlob({
    jobId: 'b7dd4943-009e-49bb-b06b-fef8aa365b02', // will be created as a folder in the blob container
    taskId: 'b7dd4943-009e-49bb-b06b-fef8aa365b03', // will be created as a subfolder inside jobId folder in the blob container
    content: 'Hello world!',                       // content as base64 or pure text
    fileName: 'helloworld.txt'                     // fileName for the blob
  })
  console.log(result)
} catch (error) {
  console.log((error.details && error.details.message) || error)
}
```

**Response**

Will be the path to the blob in the blob container: `b7dd4943-009e-49bb-b06b-fef8aa365b02/b7dd4943-009e-49bb-b06b-fef8aa365b03/helloworld.txt`

#### Download blob

**Request**
```javascript
const { downloadBlob } = require('./blob-storage')
try {
  const result = await downloadBlob({
    jobId: 'b7dd4943-009e-49bb-b06b-fef8aa365b02', // will be the folder in the blob container
    taskId: 'b7dd4943-009e-49bb-b06b-fef8aa365b03', // will be the subfolder inside jobId folder in the blob container
    fileName: 'helloworld.txt'                     // blob fileName
  })
  console.log(result)
} catch (error) {
  console.log((error.details && error.details.message) || error)
}
```

**Response**
```json
{
  "fileName": "helloworld.txt",
  "content": "Hello world!"
}
```

#### Download all blobs from a folder

**Request**
```javascript
const { downloadFolder } = require('./blob-storage')
try {
  const result = await downloadFolder('b7dd4943-009e-49bb-b06b-fef8aa365b02') // will download all files from the root folder (recursively)
  const result2 = await downloadFolder('b7dd4943-009e-49bb-b06b-fef8aa365b02/b7dd4943-009e-49bb-b06b-fef8aa365b03') // will download all files from the subfolder in the root folder (recursively)
  console.log(result)
  console.log(result2)
} catch (error) {
  console.log((error.details && error.details.message) || error)
}
```

**Response**
```json
// result
[
  {
    "fileName": "helloworld.txt",
    "content": "Hello world!"
  },
  {
    "fileName": "helloworld2.txt",
    "content": "Hello world2!"
  }
]

// result2
[
  {
    "fileName": "helloworld2.txt",
    "content": "Hello world2!"
  }
]
```

#### Delete blob

**Request**
```javascript
const { deleteBlob } = require('./blob-storage')
try {
  await deleteBlob('b7dd4943-009e-49bb-b06b-fef8aa365b02/b7dd4943-009e-49bb-b06b-fef8aa365b03/helloworld.txt') // will be the path to the file in blob container
} catch (error) {
  console.log((error.details && error.details.message) || error)
}
```

**Response**: This will not return a response but will throw an error if something fails!

#### Delete all blobs from a folder and the folder itself

**Request**
```javascript
const { deleteFolder } = require('./blob-storage')
try {
  await deleteFolder('b7dd4943-009e-49bb-b06b-fef8aa365b02/b7dd4943-009e-49bb-b06b-fef8aa365b03') // will delete all files inside the subfolder (recursively) in root folder, aswell as the subfolder itself
  await deleteFolder('b7dd4943-009e-49bb-b06b-fef8aa365b02') // will delete all files inside the root folder (recursively), aswell as the root folder itself
} catch (error) {
  console.log((error.details && error.details.message) || error)
}
```

**Response**: This will not return a response but will throw an error if something fails!
