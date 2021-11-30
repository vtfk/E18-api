# E18-api

## Usage

For local development create a `.env.development` file
```bash
DBCONNECTIONSTRING=mongodb+srv://<username>:<password>@<mongoHost>?retryWrites=true&w=majority
STORAGE_ACCOUNT_CONNECTIONSTRING=get-connection-string-from-access-keys-on-your-storage-account
STORAGE_ACCOUNT_BLOB_NAME=files
```

## Blob storage

Create a storage account in your resource group.

Create a blob container with the name specified in `STORAGE_ACCOUNT_BLOB_NAME`

### Usage

#### Upload blob

**Request**
```javascript
const { uploadBlob } = require('./blob-storage')
try {
  const result = await uploadBlob({
    jobId: 'b7dd4943-009e-49bb-b06b-fef8aa365b02', // will be created as a folder in the blob container
    content: 'Hello world!',                       // content as base64 or pure text 
    fileName: 'helloworld.txt'                     // fileName for the blob
  })
  console.log(result)
} catch (error) {
  console.log((error.details && error.details.message) || error)
}
```

**Response**

Will be the path to the blob in the blob container: `b7dd4943-009e-49bb-b06b-fef8aa365b02/helloworld.txt`

#### Download blob

**Request**
```javascript
const { downloadBlob } = require('./blob-storage')
try {
  const result = await downloadBlob({
    jobId: 'b7dd4943-009e-49bb-b06b-fef8aa365b02', // will be the folder in the blob container
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
  const result = await downloadFolder('b7dd4943-009e-49bb-b06b-fef8aa365b02') // will be the folder in the blob container
  console.log(result)
} catch (error) {
  console.log((error.details && error.details.message) || error)
}
```

**Response**
```json
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
```
