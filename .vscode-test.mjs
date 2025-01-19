import { defineConfig } from '@vscode/test-cli';
import path from 'path';

export default defineConfig({
	files: 'out/test/**/*.test.js',
  workspaceFolder: path.resolve("src", "test", "test-workspace"),
  env: {
    TERMIN_ALL_OR_NOTHING_TEST: true,
  },
  mocha: {
    timeout: 60000,
    parallel: false,
  },
});
