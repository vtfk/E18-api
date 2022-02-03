module.exports = [
  // Missing system
  {
    description: 'Missing system',
    data: {
      projectId: 0,
      tasks: [
        {
          system: 'svarut',
          method: 'send',
          data: {
            message: 'test'
          }
        }
      ]
    }
  },
  // System is not string
  {
    description: 'System is not of type string',
    data: {
      system: 123,
      projectId: 0,
      tasks: [
        {
          system: 'svarut',
          method: 'send',
          data: {
            message: 'test'
          }
        }
      ]
    }
  },
  {
    description: 'Missing projectId',
    data: {
      system: 'E18',
      tasks: [
        {
          system: 'svarut',
          method: 'send',
          data: {
            message: 'test'
          }
        }
      ]
    }
  },
  {
    description: 'ProjectID is not number',
    data: {
      system: 'E18',
      projectId: 'FEIL',
      tasks: [
        {
          system: 'svarut',
          method: 'send',
          data: {
            message: 'test'
          }
        }
      ]
    }
  },
  {
    description: 'task.data is empty object',
    data: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'e18',
          method: 'e18-test',
          data: {}
        }
      ]
    }
  },
  {
    description: 'task.data is empty array',
    data: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'e18',
          method: 'e18-test',
          data: []
        }
      ]
    }
  },
  {
    description: 'Missing tasks',
    data: {
      system: 'E18',
      projectId: 0
    }
  },
  {
    description: 'Job has task with invalid datamapping JSON',
    data: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'p360',
          method: 'archive',
          dataMapping: '{parameter": { "Documents": [ { "DocumentNumber": "{{DocumentNumber}}" }]}}'
        }
      ]
    }
  },
  {
    description: 'Job has task with invalid datamapping JSON in array',
    data: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'p360',
          method: 'archive',
          dataMapping: [
            '*',
            '{parameter": { "Documents": [ { "DocumentNumber": "{{DocumentNumber}}" }]}}'
          ]
        },
        {
          system: 'p360',
          method: 'archive',
          dependencies: ['B']
        }
      ]
    }
  }
]
