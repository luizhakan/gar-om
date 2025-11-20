import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
    },
    collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
    coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
    clearMocks: true,
};

export default config;
