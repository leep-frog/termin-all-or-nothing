import * as vscode from "vscode";

function extensionCommand(subCommand: string): string {
  return `termin-all-or-nothing.${subCommand}`;
}

const openCommands = [
  extensionCommand("openPanel"),
];
const closeCommands = [
  extensionCommand("closePanel"),
];

export const AUTO_CLOSE_WAIT_THRESHOLD_MS = 150;

/*
Tests:
- Open file from command pallete
- Ctrl+click unopened file from terminal
- Ctrl+click open file from terminal
- File explorer single-click unopened file from terminal
- File explorer double-click unopened file from terminal
- File explorer single-click open file from terminal (does nothing)
- File explorer double-click open file from terminal (partial open)
- `code filename.txt` for an unopened file from terminal
- `code filename.txt` for an open file from terminal
- `code filename.txt` for a new file from terminal
- `code filename.txt` for a new file that is already open from terminal
- openPanel to output tab (should not close panel)
- switch panel tab to output tab (should not close panel)
- Reload window (starting in editor), openPanel to output tab (should not close panel)
- Reload window (starting in panel), switch focus to and from output tab (should not close panel)
- Test running go.test.package commmand and groog.message.info (with args) wrapped by execute

Note, all test cases above also apply for notebooks
*/

function isRelevantUri(uri: vscode.Uri): boolean {
  return [
    "file",
    "vscode-notebook-cell",
    "untitled", // VS Code scheme when a new file is created (via `code newFile.py`, for example)
  ].includes(uri.scheme);
}

export class Terminator {

  private togglingPanel: boolean;
  private autoClosingEnabled: boolean;
  private previouslyVisibleEditors: VisibleEditorSet;
  private previouslyVisibleNotebooks: VisibleEditorSet;
  private lastOpenTimeMs: number;
  private panelStateTracker: PanelStateTracker;

  constructor() {
    this.togglingPanel = false;
    this.autoClosingEnabled = true;
    this.previouslyVisibleEditors = new VisibleEditorSet(vscode.window.visibleTextEditors.map(ve => ve.document.uri));
    this.previouslyVisibleNotebooks = new VisibleEditorSet(vscode.window.visibleNotebookEditors.map(nb => nb.notebook.uri));
    this.lastOpenTimeMs = 0;
    this.panelStateTracker = new PanelStateTracker();
  }

  activate(context: vscode.ExtensionContext) {

    this.registerCommand(context, extensionCommand("execute"), (args: ExecuteArgs) => this.execute(args));

    // This triggers when the set of visible text editors (including output panel view) changes.
    // When opening a file from the terminal, sometimes the onDidChangeTextEditorVisibleRanges
    // event doesn't fire (and sometimes it does), but this one seems to always handle that case.
    this.register(context, vscode.window.onDidChangeVisibleTextEditors(async (visibleEditors) => {
      // Note: we don't check the response value here because the below logic will take care of closing the panel as needed.
      // But, we do call it because we want to make sure that the tracker is as up to date as it can be.
      this.panelStateTracker.update(visibleEditors);

      const newlyVisibleEditors = new VisibleEditorSet(visibleEditors.map(ve => ve.document.uri));

      if (this.previouslyVisibleEditors.fileAdded(newlyVisibleEditors)) {
        await this.closePanel(false, "VisibleTextEditors");
      }

      this.previouslyVisibleEditors = newlyVisibleEditors;
    }));

    // Identical to above but for notebooks
    this.register(context, vscode.window.onDidChangeVisibleNotebookEditors(async (visibleNotebooks) => {
      const newlyVisibleNotebooks = new VisibleEditorSet(visibleNotebooks.map(nb => nb.notebook.uri));

      if (this.previouslyVisibleNotebooks.fileAdded(newlyVisibleNotebooks)) {
        await this.closePanel(false, "VisibleNotebookEditors");
      }

      this.previouslyVisibleNotebooks = newlyVisibleNotebooks;
    }));

    // Command registrations
    for (const cmd of openCommands) {
      this.registerCommand(context, cmd, async () => this.openPanel());
    }

    for (const cmd of closeCommands) {
      this.registerCommand(context, cmd, async () => this.closePanel(true, "CMD:" + cmd));
    }

    // Solution 2: https://github.com/leep-frog/termin-all-or-nothing/issues/3#issuecomment-2661728835
    // This is intended to cover the case where the user focuses on an a file that is already present in an editor.
    this.register(context, vscode.window.onDidChangeTextEditorVisibleRanges(async (event) => {
      if (this.panelStateTracker.update(vscode.window.visibleTextEditors)) {
        await this.closePanel(false, "PanelStateTracker - TextEditors");
      }
    })); // TODO: Add same thing for notebooks

    // Old implementation learnings

    // This only triggers when a file is closed or focus changes. This won't
    // trigger when the terminal is open (because the active editor behind the
    // terminal is still the same).
    // This hook also registers when switching to and from the `Output`
    // tab in the panel view.
    /*this.register(context, vscode.window.onDidChangeActiveTextEditor((activeEditor) => {
    }));*/

    // This only activates when a terminal is created, focus is changed from one terminal
    // to another terminal, or all terminals are terminated (aka permanently closed).
    // Unfortunately, it does not help with the scenario of switching between text editors and terminals.
    // context.subscriptions.push(vscode.window.onDidChangeActiveTerminal((t : vscode.Terminal | undefined) => {}));

    // This event only triggers when a new terminal is created.
    // context.subscriptions.push(vscode.window.onDidOpenTerminal((activeEditor) => {}));

    // This is activated when a file is opened (via File Explorer or ctrl+click in terminal) from
    // the panel view. Those actions cause a half-open page and half-open panel.
    // This event notices that the visible ranges of the files changed and closes the terminal.
    // **This occasionally triggers when in the panel view which can cause the panel
    // to close unexpectedly. I'm not sure of all of the cases that cause such behavior
    // while in the panel, but given the fragility of it, it's probably best to avoid using.**
    /*this.register(context, vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
      if (!isOutputUri(event.textEditor.document.uri) && event.visibleRanges.length) {
        this.closePanel(false, "TextEditorVisibleRange");
      }
    }));*/
  }

  register(context: vscode.ExtensionContext, ...sub: { dispose(): any }[]) {
    context.subscriptions.push(...sub);
  }

  registerCommand(context: vscode.ExtensionContext, commandName: string, callback: (...args: any[]) => Thenable<any>) {
    this.register(context, vscode.commands.registerCommand(commandName, callback));
  }

  async openPanel(): Promise<void> {
    if (this.togglingPanel) {
      return;
    }
    this.togglingPanel = true;
    this.lastOpenTimeMs = Date.now();
    await vscode.commands.executeCommand("workbench.action.toggleMaximizedPanel");
    this.togglingPanel = false;
  }

  canAutoClose(): boolean {
    // Only if auto-closing is enabled and if the user didn't try to open recently.
    return this.autoClosingEnabled && Date.now() - this.lastOpenTimeMs >= AUTO_CLOSE_WAIT_THRESHOLD_MS;
  }

  async closePanel(userInitiated: boolean, id: string): Promise<void> {
    if (this.togglingPanel) {
      return;
    }

    if (userInitiated || this.canAutoClose()) {
      this.togglingPanel = true;
      // Before closing the panel, we move it down a little bit so that the panel
      // isn't as high as it can be (which would cause all visible ranges in cyborg mode
      // to be one line which would prevent 'Solution 2' from working).
      await vscode.commands.executeCommand("workbench.action.terminal.resizePaneDown");

      await vscode.commands.executeCommand("workbench.action.closePanel");
      if (process.env.TERMIN_ALL_OR_NOTHING_TEST) {
        vscode.window.showInformationMessage(`Closing from ${id}`);
      }
      this.togglingPanel = false;
    }
  }

  async execute(args: ExecuteArgs) {
    this.autoClosingEnabled = false;
    try {
      await vscode.commands.executeCommand(args.command, args.args);
    } catch {
    } finally {
      this.autoClosingEnabled = true;
    }
  }
}

export interface ExecuteArgs {
  command: string;
  args: any;
}

function mapReplacer(key: any, value: any) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: [...value],
    };
  } else {
    return value;
  }
}

// Note, we don't use a regular `Set` here because sometimes
// the same file is open in multiple editors.
export class VisibleEditorSet {
  private map: Map<vscode.Uri, number>;

  constructor(uris: readonly vscode.Uri[]) {
    this.map = new Map();
    uris.forEach(uri => {
      this.map.set(uri, 1 + (this.map.get(uri) || 0));
    });
  }

  toJSON(): string {
    return JSON.stringify(this.map, mapReplacer, 2);
  }

  // fileAdded returns whether or not the new set of editors
  // includes a file that is not included in the existing
  // set of editors (aka `this`).
  fileAdded(newEditors: VisibleEditorSet): boolean {
    for (const [uri, newCount,] of newEditors.map) {
      // TODO: add test when multiple editors with the same file
      const prevCount = this.map.get(uri) || 0;
      if (newCount > prevCount && isRelevantUri(uri)) {
        return true;
      }
    }
    return false;
  }
}

export class PanelStateTracker {
  inPanel: boolean;

  constructor() {
    this.inPanel = false; // This gets set by the next line. Just need this here to satisfy non-optional assumption by typescript.

    // TODO: add visibleNotebookEditors too
    this.update(vscode.window.visibleTextEditors)
  }

  // update updates the state of this object and returns whether or not the panel should be closed.
  update(visibleTextEditors: readonly vscode.TextEditor[]): boolean {
    // Considered inPanel if every visible range in every visible editor is a single line.
    const nowInPanel = visibleTextEditors.every(editor => editor.visibleRanges.every(this.minimalRange));

    const closePanel = (this.inPanel && !nowInPanel);

    this.inPanel = nowInPanel;
    return closePanel;
  }

  private minimalRange(range: vscode.Range) {
    return range.start.line === range.end.line;
  }
}
