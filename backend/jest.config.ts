import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
    },
    // Adicione este mapeamento para corrigir o erro "Cannot find module src/..."
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/test/integration/jest-setup.ts'],
    collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
    coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
    clearMocks: true,
};

export default config;