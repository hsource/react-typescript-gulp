module.exports = {
  roots: ['<rootDir>/server', '<rootDir>/client'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['<rootDir>/{server,client}/**/*.test.(js|ts)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      diagnostics: {
        ignoreCodes: [151001], // See https://github.com/kulshekhar/ts-jest/issues/748
      },
    },
  },
};
