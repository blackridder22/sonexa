const path = require('path');

module.exports = {
  app: {
    getPath: jest.fn((name) => {
      if (name === 'home') {
        return path.join(__dirname, '..', '..', 'test_home');
      }
      return '';
    }),
  },
};