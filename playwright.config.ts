import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'src/tests/e2e',
	timeout: 30000,
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: true
	},
	use: {
		baseURL: 'http://localhost:4173'
	}
});
