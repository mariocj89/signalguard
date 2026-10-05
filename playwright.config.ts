import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, retries: 0,
  use: { baseURL: 'http://127.0.0.1:8088', browserName: 'chromium', viewport: { width: 390, height: 844 }, locale: 'en-GB' },
  webServer: { command: 'SIGNALGUARD_INSPECTION=1 EXPO_NO_WEB_SETUP=1 EXPO_NO_TELEMETRY=1 CI=1 npx expo start --web --port 8088', url: 'http://127.0.0.1:8088', reuseExistingServer: false, timeout: 120000 },
});
