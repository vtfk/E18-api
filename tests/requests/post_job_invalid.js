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
  // Missing projectId
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
  // Missing tasks
  {
    description: 'Missing tasks',
    data: {
      system: 'E18',
      projectId: 0
    }
  },
  // // Task is missing data
  // {
  //   description: 'Tasks are missing data',
  //   data: {
  //     system: 'E18',
  //     projectId: 0,
  //     tasks: [
  //       {
  //         system: 'svarut',
  //         method: 'send'
  //       }
  //     ]
  //   }
  // },
  // Task has unknown system
  // {
  //   description: 'taskHasUnknownSystem',
  //   data: {
  //     system: 'E18',
  //     projectId: 0,
  //     tasks: [
  //       {
  //         system: 'FEIL',
  //         method: 'send'
  //       }
  //     ]
  //   }
  // },
  // // Task has unknown method
  // {
  //   description: 'taskHasUnknownMethod',
  //   data: {
  //     system: 'E18',
  //     projectId: 0,
  //     tasks: [
  //       {
  //         system: 'svarut',
  //         method: 'FEIL'
  //       }
  //     ]
  //   }
  // },
  // Task has unknown method
  {
    description: 'singleTaskHasDependencyTag',
    date: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'svarut',
          method: 'send',
          dependencyTag: 'A'
        }
      ]
    }
  },
  {
    description: 'singleTaskHasDependencies',
    data: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'svarut',
          method: 'send',
          dependencies: ['A']
        }
      ]
    }
  },
  {
    description: 'taskHasSelfAsDependency',
    data: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'svarut',
          method: 'send',
          dependencyTag: 'A',
          dependencies: ['A']
        },
        {
          system: 'p360',
          method: 'archive'
        }
      ]
    }
  },
  {
    description: 'taskHasDependencyThatDoesNotExist',
    data: {
      system: 'E18',
      projectId: 0,
      tasks: [
        {
          system: 'svarut',
          method: 'send',
          dependencyTag: 'A'
        },
        {
          system: 'p360',
          method: 'archive',
          dependencies: ['B']
        }
      ]
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
