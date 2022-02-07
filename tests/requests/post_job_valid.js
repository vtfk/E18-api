module.exports = [
  {
    description: 'Regular E18 job',
    data: {
      system: 'E18',
      type: 'test',
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
      type: 'test',
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
      type: 'test',
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
      type: 'test',
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
  },
  {
    description: 'Job with task containing array data',
    data: {
      system: 'E18',
      type: 'test',
      projectId: 0,
      tasks: [
        {
          system: 'e18-test',
          method: 'test',
          data: ['test']
        }
      ]
    }
  },
  {
    description: 'Job with task containing string data',
    data: {
      system: 'E18',
      type: 'test',
      projectId: 0,
      tasks: [
        {
          system: 'e18-test',
          method: 'test',
          data: 'test'
        }
      ]
    }
  },
  {
    description: 'Job with task containing number data',
    data: {
      system: 'E18',
      type: 'test',
      projectId: 0,
      tasks: [
        {
          system: 'e18-test',
          method: 'test',
          data: 123
        }
      ]
    }
  },
  {
    description: 'Job with task containing bool data',
    data: {
      system: 'E18',
      type: 'test',
      projectId: 0,
      tasks: [
        {
          system: 'e18-test',
          method: 'test',
          data: true
        }
      ]
    }
  }
]
