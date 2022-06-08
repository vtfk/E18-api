# E18-api
E18 is a system for central async job queue, error handeling and statistics.<br>
It is composed of the following components:
* API (This project)
* Database (MongoDB)
* Orchestrator (Microsoft Azure Logic App)
* [Web frontend](https://github.com/vtfk/e18-web)

The philosophy behind E18 is that systems can fire and forget jobs to it and be certain that it either will run sucessfully or that any errors will be seen and delt with via the frontend.

## E18 jobs
An E18 job contain information about the system that requested it, the purpose for the job as well as some other optional metadata and configuration options, it also contains one or more tasks that should be run.<br>
The specifics about the fields are documented in detail

## How it works:
The E18 API exposes an endpoint that let other systemes registers jobs on it.<br>
The system creates a job-request with one or more tasks and sends it to E18 (fire and forget)

E18 then does the following:
1. The orchestrator runs periodically and checks for tasks that are ready to run<br>
   Tasks will as default run sequentially, but they can be grouped to run in parallell
1. It verifies that the tasks is for an approved third-party system
1. The job is executed
1. The result is logged back to the job entry

### If a task fails
1. The error is logged back to the task
1. The orchestrator will attempt to re-run the task X times, before giving up
1. Tasks that don't run succesfully will stay in the queue until delt with via the frontend

### When all tasks are completed successfully
1. When the last task for a job is sucessfull the job is set to completed
1. When the orchestrator runs maintenance it will strip away any non-metadata and move the job for the queue to statistics

# Usage

## Update openAPI specification in API Manager

Microsoft uses it's own `servers` object in the specification. So to update the **openAPI** specification in APIM:
- Copy all content from the *yaml* file
- Open the **API** in APIM
- Select the arrow down in **Frontend** and choose `OpenAPI editor (YAML)`
- Paste in the new *yaml* replacing the old one
- Remove the `servers` section
- Click **Save**

## Add statistics from a system

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
## Register a job for E18 to execute
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
      "data": { "someData": "test" }, // Optional: Object that will be sent to the task endpoint
      "tags": [
        "hey there"
      ]
    }
  ]
}
```

## Register job with tasks that can run in parallel
**`POST /jobs`**
```json
{
  "system": "<unique-identifier-for-your-system>",
  "type": "<unique-identifier-for-this-operation>",
  "projectId": 0,
  "parallel": true, // If set to true all tasks will run in parallel if dependency information is provided
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

## Register job with tasks that can run by grouping them
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
      "data": { "someData": "test" }
    },
    {
      "system": "<which-system/api-has-been-used>",
      "method": "<which-endpoint-in-system/api-has-been-called",
      "group": "group1",
      "data": { "someData": "test" }
    },
    {
      "system": "<which-system/api-has-been-used>",
      "method": "<which-endpoint-in-system/api-has-been-called",
      "group": "group1", // This task will run together with the above task
      "data": { "someData": "test" }
    }
  ]
}
```

## Register job where all tasks run in parallel
**`POST /jobs`**
```json
{
  "system": "<unique-identifier-for-your-system>",
  "type": "<unique-identifier-for-this-operation>",
  "projectId": 0,
  "parallel": true, // This will make all tasks run in parallel
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
    },
    {
      "system": "<which-system/api-has-been-used>",
      "method": "<which-endpoint-in-system/api-has-been-called",
      "data": { "someData": "test" }
    }
  ]
}
```

## Register new API key
**`POST /apikeys`**
```json
{
  "name": "Key name"
}
```

> Add `?fullitem=true` to the URL to retrieve the full item from db

## Update API key

### Enable / Disable
**`PUT /apikeys/:id`**
```json
{
  "name": "Key name", // required field
  "enabled": true | false
}
```

### Remove API key
**`DELETE /apikeys/:id`**

# Data mapping
E18 has the capability to merge data from the task operations into subsequent tasks.\
This is done through the task property **dataMapping**\
There are three *types* of dataMapping: 1:1, template and full.\
the dataMapping can also be an array with multiple mappings.
## Examples
### 1:1 mappings
```json
/*
  Mappings:
  name from previous operations will be mapped to fullname
*/
{
  "system": "e18",
  "type": "example",
  "tasks": [
    {
      "system": "system1",
      "method": "system1-method"
    },
    {
      "system": "system2",
      "method": "system2-method",
      "dataMapping": "fullname=name"
    }
  ]
}
```
```json
/*
  Mappings:
  firstname will be mapped to person.name.firstname
  lastname will be mapped to person.name.lastname
  The object hiearchy does not need to already be present in data property
*/
{
  "system": "e18",
  "type": "example",
  "tasks": [
    {
      "system": "system1",
      "method": "system1-method"
    },
    {
      "system": "system2",
      "method": "system2-method",
      "dataMapping": [
        "person.name.firstname=firstname",
        "person.name.lastname=lastname"
      ]
    }
  ]
}
```
### Full mapping
```json
/*
  Mappings:
  All data from previous operations will be merged into the tasks data
*/
{
  "system": "e18",
  "type": "example",
  "tasks": [
    {
      "system": "system1",
      "method": "system1-method"
    },
    {
      "system": "system2",
      "method": "system2-method",
      "dataMapping": "*"
    }
  ]
}
```

### Template mapping
Works by providing a JSON-object template with placeholders to be replaced.\
The placeholders can be Mustache or Sjablong-fields.\
It also supports handlebars-expressions.
```json
/* 
  Mappings:
  Replaces all data that matches the placeholders
*/
{
  "system": "e18",
  "type": "example",
  "tasks": [
    {
      "system": "system1",
      "method": "system1-method"
    },
    {
      "system": "system2",
      "method": "system2-method",
      "dataMapping": "{\"person\": {\"firstname\": \"{{firstname}}\"}}"
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

## Environment variables
| Variable | Description | Example |
|---|---|---|
|DBCONNECTIONSTRING|MongoDB connection string |
|STORAGE_ACCOUNT_CONNECTIONSTRING|Connection string for Azure storage account |
|STORAGE_ACCOUNT_BLOB_NAME|Name of the blob container
|APPLICATIONINSIGHTS_CONNECTION_STRING|Connectionstring for Azure Application Insights (optional)
