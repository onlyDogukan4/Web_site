import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.js'],
        fileParallelism: false,
        env: {
            PAYTR_MOCK: 'true',
            PAYTR_TEST_MODE: '1',
        },
    },
});
