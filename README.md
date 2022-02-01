# E18-api
## Usage

### Add statistics from a system

**`POST /jobs`**

```json
{
  "system": "<unique-identifier-for-your-system>",
  "type": "<unique-identifier-for-this-operation>",
  "status": "completed", // must be set to completed for statistics
  "projectId": 0, // Project id
  "e18": false, // must be set to false for statistics
  "tasks": [ // add one task entry pr item this job has performed
    {
      "system": "<which-system/api-has-been-used>", // see system overview
      "method": "<which-endpoint-in-system/api-has-been-called",
      "status": "completed", // must be set to completed for statistics
      "regarding": "something", // optional free text field (no sensitive information!)
      "tags": [ // optional array of tags (can be handy for sorting in statistics overview)
        "hey there"
      ]
    }
  ]
}
```
### Register a job for E18 to execute
**`POST /jobs`**
```json
{
  "system": "<unique-identifier-for-your-system>",
  "type": "<unique-identifier-for-this-operation>",
  "projectId": 0,
  "tasks": [
    {
      "system": "<which-system/api-has-been-used>",
      "method": "<which-endpoint-in-system/api-has-been-called",
      "regarding": "something",
      "data": { "someData": "test" } // Optional: Object that will be sent to the task endpoint
      "tags": [
        "hey there"
      ]
    }
  ]
}
```

### Register job with tasks that can run in parallell
**`POST /jobs`**
```json
{
  "system": "<unique-identifier-for-your-system>",
  "type": "<unique-identifier-for-this-operation>",
  "projectId": 0,
  "parallell": true, // If set to true all tasks will run in parallell if dependency information is provided
  "tasks": [
    {
      "system": "<which-system/api-has-been-used>",
      "method": "<which-endpoint-in-system/api-has-been-called",
      "data": { "someData": "test" }
    },
    {
      "system": "<which-system/api-has-been-used>",
      "method": "<which-endpoint-in-system/api-has-been-called",
      "data": { "someData": "test" }
    }
  ]
}
```

### Register job with tasks that can run in parallell and with dependencies
**`POST /jobs`**
```json
{
  "system": "<unique-identifier-for-your-system>",
  "type": "<unique-identifier-for-this-operation>",
  "projectId": 0,
  "parallell": true, // Tasks are parallell
  "tasks": [
    {
      "system": "<which-system/api-has-been-used>",
      "method": "<which-endpoint-in-system/api-has-been-called",
      "dependencyTag": "first", // The tag can be any string
      "data": { "someData": "test" }
    },
    {
      "system": "<which-system/api-has-been-used>",
      "method": "<which-endpoint-in-system/api-has-been-called",
      "dependencyTag": "first" // The tag can be any string
      "data": { "someData": "test" }
    },
    {
      "system": "<which-system/api-has-been-used>",
      "method": "<which-endpoint-in-system/api-has-been-called",
      "dependencies": ["first"], // This task is set to wait until all tasks with the dependencyTag 'first' has completed
      "data": { "someData": "test" }
    }
  ]
}
```

## Local development

For local development create a `.env.development` file
```bash
DBCONNECTIONSTRING=mongodb+srv://<username>:<password>@<mongoHost>?retryWrites=true&w=majority
AZURE_BLOB_CONNECTIONSTRING=get-connection-string-from-access-keys-on-your-storage-account
AZURE_BLOB_CONTAINERNAME=files
```
*If no 'DBCONNECTIONSTRING' is provided, the API will create a MongoMemoryServer instance on port 9000*
