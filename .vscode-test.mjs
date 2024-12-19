import { defineConfig } from '@vscode/test-cli';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tmpWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'foo-'), (err, directory) => {
  if (err) throw err;
});

fs.cpSync(path.resolve("src", "test", "test-workspace"), tmpWorkspace, {
  recursive: true,
});

export default defineConfig({
	files: 'out/test/**/*.test.js',
  workspaceFolder: tmpWorkspace,
  env: {
    TERMIN_ALL_OR_NOTHING_TEST: true,
    TERMIN_ALL_TEST_WORKSPACE: tmpWorkspace,
  },
  mocha: {
    timeout: 60000,
    parallel: false,
  },
});
