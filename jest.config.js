module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    electron: '<rootDir>/__mocks__/electron.js',
  },
};
