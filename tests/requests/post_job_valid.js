module.exports = [
  {
    description: 'Regular E18 job',
    data: {
      system: 'E18',
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
    description: 'Self execution job',
    data: {
      system: 'E18',
      projectId: 0,
      e18: false,
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
    description: 'Second task has the first one as dependency',
    data: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'svarut',
          method: 'send',
          dependencies: ['A'],
          data: {
            message: 'test'
          }
        },
        {
          system: 'p360',
          method: 'archive',
          dependencyTag: 'A',
          data: {
            message: 'test'
          }
        }
      ]
    }
  },
  {
    description: 'Job has task with datamapping JSON',
    data: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'p360',
          method: 'archive',
          dataMapping: '{"parameter": { "Documents": [ { "DocumentNumber": "{{DocumentNumber}}" }]}}'
        }
      ]
    }
  },
  {
    description: 'Job has task with datamapping JSON in array',
    data: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'p360',
          method: 'archive',
          dataMapping: [
            '*',
            '{"parameter": { "Documents": [ { "DocumentNumber": "{{DocumentNumber}}" }]}}'
          ]
        }
      ]
    }
  }
]
