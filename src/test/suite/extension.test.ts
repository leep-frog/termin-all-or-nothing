
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { cmd, delay, SimpleTestCase, SimpleTestCaseProps, UserInteraction, Waiter } from "@leep-frog/vscode-test-stubber";
import * as vscode from "vscode";
import { AUTO_CLOSE_WAIT_THRESHOLD_MS, VisibleEditorSet } from "../../terminator";
import path = require("path");
import assert = require("assert");
// import * as myExtension from '../../extension';

interface TestCase {
  name: string;
  stc: SimpleTestCaseProps;
  waitForMessages?: string[];
  runSolo?: boolean;
}

const tmpWorkspace: string = process.env.TERMIN_ALL_TEST_WORKSPACE!;

function getUri(...filename: string[]): vscode.Uri {
  const p = path.resolve(tmpWorkspace, path.join(...filename));
  return vscode.Uri.file(p);
}

function openTestWorkspaceFile(...filename: string[]): UserInteraction {
  return cmd("vscode.open", getUri(...filename));
}

const closeAllEditors = cmd("workbench.action.closeEditorsAndGroup");

const simpleText = [
  "from typing import Dict, List",
  "",
  "",
  "def func(l: List[str]) -> Dict[str, int]:",
  "    return {v: len(v) for v in l}",
  "",
].join("\n");

const notebookText = [
  'print("Hello world")',
].join("\n");

const MAX_WAIT = 2500;

const testCases: TestCase[] = [
  {
    name: "Auto-closes the panel when an existing file is opened",
    stc: {
      userInteractions: [
        cmd("termin-all-or-nothing.openPanel"),
        delay(AUTO_CLOSE_WAIT_THRESHOLD_MS),
        openTestWorkspaceFile("simple.py"),
        new Waiter(10, () => !!vscode.window.activeTextEditor && path.basename(vscode.window.activeTextEditor.document.uri.fsPath) === "simple.py", 100),
      ],
      expectedText: [simpleText],
      informationMessage: {
        ignoreOrder: true,
        expectedMessages: [
          `Closing from VisibleTextEditors`,
        ],
      },
    },
  },
  {
    name: "Auto-closes the panel when an existing notebook is opened",
    stc: {
      userInteractions: [
        cmd("termin-all-or-nothing.openPanel"),
        delay(AUTO_CLOSE_WAIT_THRESHOLD_MS),
        openTestWorkspaceFile("notebook.ipynb"),
        new Waiter(10, () => !!vscode.window.activeNotebookEditor && path.basename(vscode.window.activeNotebookEditor.notebook.uri.fsPath) === "notebook.ipynb", 100),
      ],
      expectedText: [notebookText],
      informationMessage: {
        ignoreOrder: true,
        expectedMessages: [
          `Closing from VisibleTextEditors`,
          `Closing from VisibleNotebookEditors`,
        ],
      },
    },
  },
  {
    name: "Auto-closes the panel when a new, untitled file is opened",
    stc: {
      userInteractions: [
        cmd("termin-all-or-nothing.openPanel"),
        delay(AUTO_CLOSE_WAIT_THRESHOLD_MS),
        cmd("workbench.action.files.newUntitledFile"),
        new Waiter(10, () => {
          return !!vscode.window.activeTextEditor && path.basename(vscode.window.activeTextEditor.document.uri.fsPath) === "Untitled-1";
        }, 100),
      ],
      expectedText: [""],
      informationMessage: {
        ignoreOrder: true,
        expectedMessages: [
          `Closing from VisibleTextEditors`,
        ],
      },
    },
  },
  {
    name: "Auto-closes the panel when a new, untitled notebook is opened",
    stc: {
      userInteractions: [
        cmd("termin-all-or-nothing.openPanel"),
        delay(AUTO_CLOSE_WAIT_THRESHOLD_MS),
        cmd("ipynb.newUntitledIpynb"),
        new Waiter(10, () => {
          console.log(`WTF: ${path.basename(vscode.window.activeTextEditor?.document.uri.fsPath || "blop")}`);
          return !!vscode.window.activeTextEditor && path.basename(vscode.window.activeTextEditor.document.uri.fsPath) === "Untitled-1.ipynb"
        }, 100),
      ],
      expectedText: [""],
      informationMessage: {
        ignoreOrder: true,
        expectedMessages: [
          `Closing from VisibleNotebookEditors`,
          `Closing from VisibleTextEditors`,
        ],
      },
    },
  },
  {
    name: "Panel is not auto-closed when wrapped in execute command",
    stc: {
      userInteractions: [
        cmd("termin-all-or-nothing.openPanel"),
        delay(AUTO_CLOSE_WAIT_THRESHOLD_MS),
        cmd("termin-all-or-nothing.execute", {
          command: "vscode.open",
          args: getUri("simple.py"),
        }),
        new Waiter(10, () => !!vscode.window.activeTextEditor && path.basename(vscode.window.activeTextEditor.document.uri.fsPath) === "simple.py", 100),
      ],
      expectedText: [simpleText],
      informationMessage: {
        ignoreOrder: true,
        expectedMessages: [],
      },
    },
  },
  {
    name: "Handles exception in wrapped in execute command",
    stc: {
      userInteractions: [
        cmd("termin-all-or-nothing.openPanel"),
        delay(AUTO_CLOSE_WAIT_THRESHOLD_MS),
        cmd("termin-all-or-nothing.execute", {
          command: "idk.command",
        }),
      ],
      informationMessage: {
        ignoreOrder: true,
        expectedMessages: [],
      },
    },
  },
  {
    name: "No auto-close if within AUTO_CLOSE_WAIT_THRESHOLD_MS",
    stc: {
      userInteractions: [
        cmd("termin-all-or-nothing.openPanel"),
        delay(AUTO_CLOSE_WAIT_THRESHOLD_MS - 100),
        openTestWorkspaceFile("simple.py"),
        new Waiter(10, () => !!vscode.window.activeTextEditor && path.basename(vscode.window.activeTextEditor.document.uri.fsPath) === "simple.py", 100),
        // Give some time for things to run since we don't wait on messages.
        // If we didn't wait, then this might always pass even if the test was broken!
        delay(2 * AUTO_CLOSE_WAIT_THRESHOLD_MS),
      ],
      expectedText: [simpleText],
      informationMessage: {
        ignoreOrder: true,
        expectedMessages: [],
      },
    },
  },
];

suite("Extension Test Suite", () => {

  const oldInfo = vscode.window.showInformationMessage;

  testCases.forEach(tc => {
    test(tc.name, async () => {

      const gotInfoMessages: string[] = [];

      vscode.window.showInformationMessage = async (msg: string) => {
        gotInfoMessages.push(msg);
        return oldInfo(msg);
      };

      if (!tc.stc.userInteractions) {
        tc.stc.userInteractions = [];
      }

      tc.stc.userInteractions.unshift(closeAllEditors);

      const msDelay = 100;
      const wfms = tc.stc.informationMessage?.expectedMessages;
      if (wfms?.length) {
        tc.stc.userInteractions.push(new Waiter(msDelay, () => {
          return wfms?.length === gotInfoMessages.length && wfms.reduce((previousValue: boolean, currentValue: string) => previousValue && gotInfoMessages.includes(currentValue), true);
        }, MAX_WAIT / msDelay));
      }

      // Run test
      await new SimpleTestCase(tc.stc).runTest().catch((e: any) => {
        throw e;
      });
    });
  });
});

suite('Miscellaneous tests', () => {
  test("JSON.stringify VisibleEditorSet", () => {
    const ves = new VisibleEditorSet([
      getUri("simple.py"),
      getUri("notebook.ipynb"),
    ]);

    const got: string[] = JSON.stringify(ves).split("\\n");

    const want: string[] = [
      "\"{",
      "  \\\"dataType\\\": \\\"Map\\\",",
      "  \\\"value\\\": [",
      "    [",
      "      {",
      "        \\\"$mid\\\": 1,",
      "        \\\"path\\\": \\\"/C:/Users/gleep/Desktop/Coding/vs-code/termin-all-or-nothing/src/test/test-workspace/simple.py\\\",",
      "        \\\"scheme\\\": \\\"file\\\"",
      "      },",
      "      1",
      "    ],",
      "    [",
      "      {",
      "        \\\"$mid\\\": 1,",
      "        \\\"path\\\": \\\"/C:/Users/gleep/Desktop/Coding/vs-code/termin-all-or-nothing/src/test/test-workspace/notebook.ipynb\\\",",
      "        \\\"scheme\\\": \\\"file\\\"",
      "      },",
      "      1",
      "    ]",
      "  ]",
      "}\"",
    ];

    assert.deepStrictEqual(want, got);
  });
});
