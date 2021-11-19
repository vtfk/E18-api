


module.exports = {
  // Missing system
  missingSystem: {
    projectId: 0,
    tasks: [
      {
        system: 'svarut',
        method: 'send',
        data: {
          message: 'test'
        }
      },
    ]
  },
  // System is not string
  systemIsNotString: {
    system: 123,
    projectId: 0,
    tasks: [
      {
        system: 'svarut',
        method: 'send',
        data: {
          message: 'test'
        }
      },
    ]
  },
  // Missing projectId
  missingProjectId: {
    system: 'E18',
    tasks: [
      {
        system: 'svarut',
        method: 'send',
        data: {
          message: 'test'
        }
      },
    ]
  },
  // Missing projectId
  projectIdIsNotNumber: {
    system: 'E18',
    projectId: 'FEIL',
    tasks: [
      {
        system: 'svarut',
        method: 'send',
        data: {
          message: 'test'
        }
      },
    ]
  },
  // Missing tasks
  missingTasks: {
    system: 'E18',
    projectId: 0,
  },
  // Task is missing data
  taskIsMissingData: {
    system: 'E18',
    projectId: 0,
    tasks: [
      {
        system: 'svarut',
        method: 'send',
      },
    ]
  },
  // Task has unknown system
  taskHasUnknownSystem: {
    system: 'E18',
    projectId: 0,
    tasks: [
      {
        system: 'FEIL',
        method: 'send',
      },
    ]
  },
  // Task has unknown method
  taskHasUnknownMethod: {
    system: 'E18',
    projectId: 0,
    tasks: [
      {
        system: 'svarut',
        method: 'FEIL',
      },
    ]
  },
  // Task has unknown method
  singleTaskHasDependencyTag: {
    system: 'E18',
    projectId: 0,
    tasks: [
      {
        system: 'svarut',
        method: 'send',
        dependencyTag: 'A'
      },
    ]
  },
  singleTaskHasDependencies: {
    system: 'E18',
    projectId: 0,
    tasks: [
      {
        system: 'svarut',
        method: 'send',
        dependencies: ['A']
      },
    ]
  },
  taskHasSelfAsDependency: {
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
        method: 'archive',
      }
    ]
  },
  taskHasDependencyThatDoesNotExist: {
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
  },
}

