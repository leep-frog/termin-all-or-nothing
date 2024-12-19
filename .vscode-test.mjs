import { defineConfig } from '@vscode/test-cli';
import path from 'path';

export default defineConfig({
	files: 'out/test/**/*.test.js',
  workspaceFolder: tmpWorkspace,
  env: {
    TERMIN_ALL_OR_NOTHING_TEST: true,
    TERMIN_ALL_TEST_WORKSPACE: path.resolve("src", "test", "test-workspace"),
  },
  mocha: {
    timeout: 60000,
    parallel: false,
  },
});
