import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Custom Jest configuration
const customJestConfig: Config = {
  testEnvironment: 'jest-environment-jsdom', // Use jsdom for React testing
  coverageProvider: 'v8', // Use V8 for coverage
  moduleNameMapper: {
    // Map TypeScript paths from tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Include custom setup
  testPathIgnorePatterns: [
    '<rootDir>/.next/', // Ignore .next folder
    '<rootDir>/node_modules/', // Ignore node_modules
  ],
  collectCoverage: false, // Enable code coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}', // Include TypeScript files in coverage
    '!src/**/*.d.ts', // Exclude TypeScript declaration files
    '!src/**/index.ts', // Exclude barrel files (optional)
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src'], // Module resolution paths
};

// Export the configuration
export default createJestConfig(customJestConfig);
