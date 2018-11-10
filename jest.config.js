module.exports = {
  roots: ['<rootDir>/server', '<rootDir>/client'],
  testMatch: ['<rootDir>/{server,client}/**/*.test.(js|ts)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  transform: {
    '^.+\\.jsx$': 'babel-jest',
    '^.+\\.js$': 'babel-jest',
    '^.+\\.tsx$': 'babel-jest',
    '^.+\\.ts$': 'babel-jest',
  },
  setupTestFrameworkScriptFile: './tests/Setup.ts',
};
