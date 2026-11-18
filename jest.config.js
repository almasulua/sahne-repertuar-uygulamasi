/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest for pure TS unit tests — avoids the heavy RN/Expo Babel chain
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        // Relax for tests
        strict: false,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
