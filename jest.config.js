module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/src'],
     testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
     collectCoverageFrom: [
          'src/**/*.ts',
          '!src/**/*.d.ts',
          '!src/**/__tests__/**',
          '!src/server.ts',
          '!src/config/**',
     ],
     coverageDirectory: 'coverage',
     moduleNameMapper: {
          '^@/(.*)$': '<rootDir>/src/$1',
     },
};
