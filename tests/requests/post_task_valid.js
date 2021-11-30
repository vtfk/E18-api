module.exports = [
  {
    description: 'Task that E18 should process',
    e18: false,
    data: {
      system: 'svarut',
      method: 'letter',
      data: {
        test: 'test'
      }
    }
  },
  {
    description: 'Task that should be self-executed',
    e18: false,
    data: {
      system: 'p360',
      method: 'archive'
    }
  }
]
