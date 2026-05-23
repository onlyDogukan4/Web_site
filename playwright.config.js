import { defineConfig } from '@playwright/test';

const PORT = process.env.TEST_PORT || 3099;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'node scripts/test-server.js',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
        env: {
            TEST_PORT: String(PORT),
            USE_MEMORY_DB: 'true',
            PAYTR_MOCK: 'true',
        },
    },
});
