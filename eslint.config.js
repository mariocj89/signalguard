const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([expo, { ignores: ['dist/**', 'ios/**', 'node_modules/**', '.native-tests/**', 'playwright-report/**', 'test-results/**'] }]);
