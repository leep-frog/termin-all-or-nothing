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

const AUTO_CLOSE_WAIT_THRESHOLD_MS = 150;

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
- `code filename.txt` for an open file from terminal (does nothing)
- `code filename.txt` for a new file from terminal
- `code filename.txt` for a new file that is already open from terminal (does nothing)
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

  constructor() {
    this.togglingPanel = false;
    this.autoClosingEnabled = true;
    this.previouslyVisibleEditors = new VisibleEditorSet(vscode.window.visibleTextEditors.map(ve => ve.document.uri));
    this.previouslyVisibleNotebooks = new VisibleEditorSet(vscode.window.visibleNotebookEditors.map(nb => nb.notebook.uri));
    this.lastOpenTimeMs = 0;
  }

  activate(context: vscode.ExtensionContext) {

    this.registerCommand(context, extensionCommand("autoClosePanel.enable"), () => this.setAutoClose(true));
    this.registerCommand(context, extensionCommand("autoClosePanel.disable"), () => this.setAutoClose(false));

    this.registerCommand(context, extensionCommand("execute"), (args: ExecuteArgs) => this.execute(args));

    // This triggers when the set of visible text editors (including output panel view) changes.
    // When opening a file from the terminal, sometimes the onDidChangeTextEditorVisibleRanges
    // event doesn't fire (and sometimes it does), but this one seems to always handle that case.
    this.register(context, vscode.window.onDidChangeVisibleTextEditors((visibleEditors) => {
      const newlyVisibleEditors = new VisibleEditorSet(visibleEditors.map(ve => ve.document.uri));

      if (this.previouslyVisibleEditors.fileAdded(newlyVisibleEditors)) {
        this.closePanel(false, "VisibleTextEditors");
      }

      this.previouslyVisibleEditors = newlyVisibleEditors;
    }));

    // Identical to above but for notebooks
    this.register(context, vscode.window.onDidChangeVisibleNotebookEditors((visibleNotebooks) => {
      const newlyVisibleNotebooks = new VisibleEditorSet(visibleNotebooks.map(nb => nb.notebook.uri));

      if (this.previouslyVisibleNotebooks.fileAdded(newlyVisibleNotebooks)) {
        this.closePanel(false, "VisibleNotebookEditors");
      }

      this.previouslyVisibleNotebooks = newlyVisibleNotebooks;
    }));

    // Command registrations
    for (const cmd of openCommands) {
      this.registerCommand(context, cmd, () => this.openPanel());
    }

    for (const cmd of closeCommands) {
      this.registerCommand(context, cmd, () => this.closePanel(true, "CMD:" + cmd));
    }

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

  async setAutoClose(value: boolean): Promise<void> {
    this.autoClosingEnabled = value;
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

  readonly printClosePanelID = false;

  async closePanel(userInitiated: boolean, id: string): Promise<void> {
    if (this.togglingPanel) {
      return;
    }

    if (userInitiated || this.canAutoClose()) {
      this.togglingPanel = true;
      await vscode.commands.executeCommand("workbench.action.closePanel");
      if (this.printClosePanelID) {
        vscode.window.showInformationMessage(`Closing from ${id}`);
      }
      this.togglingPanel = false;
    }
  }

  async execute(args: ExecuteArgs) {
    const oldValue: boolean = this.autoClosingEnabled;
    this.autoClosingEnabled = !!args.autoCloseEnabled;

    await vscode.commands.executeCommand(args.command, args.args);

    this.autoClosingEnabled = oldValue;
  }
}

export interface ExecuteArgs {
  autoCloseEnabled: boolean | undefined;
  command: string;
  args: any;
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

  fileAdded(newEditors: VisibleEditorSet): boolean {
    for (const [uri, newCount,] of newEditors.map) {
      const prevCount = this.map.get(uri) || 0;
      if (newCount > prevCount && isRelevantUri(uri)) {
        return true;
      }
    }
    return false;
  }
}
