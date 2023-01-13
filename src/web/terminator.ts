import * as vscode from 'vscode';

function extensionCommand(subCommand : string) : string {
  return `termin-all-or-nothing.${subCommand}`;
}

const unsetCommands : string[] = [
  // Don't override this because we call it ourselves.
  // "workbench.action.toggleMaximizedPanel",
];
const openCommands = [
  "terminal.focus",
  extensionCommand("openPanel"),
  "workbench.action.terminal.toggleTerminal",
];
const closeCommands = [
  extensionCommand("closePanel"),
];

/*
Tests:
- Ctrl+click unopened file from terminal
- Ctrl+click open file from terminal
- File explorer single-click unopened file from terminal
- File explorer double-click unopened file from terminal
- File explorer single-click open file from terminal (does nothing)
- File explorer double-click open file from terminal
- openPanel to output tab (should not close panel)
- switch panel tab to output tab (should not close panel)
- Reload window (starting in editor), openPanel to output tab (should not close panel)
- Reload window (starting in panel), switch focus to and from output tab (should not close panel)
- Test running go.test.package commmand and groog.message.info (with args) wrapped by execute
*/

function rangeToString(range : vscode.Range) : string {
  return `(${range.start.line}.${range.start.character}, ${range.end.line}.${range.end.character})`
}

function isOutputUri(uri : vscode.Uri) : boolean {
  return uri.scheme === "output";
}

function differenceOutputOnly(setA : Set<string>, setB : Set<string>) : boolean {
  const diff = new Set([...setA].filter(x => !setB.has(x)));
  return Array.from(diff).filter(s => isOutputUri(vscode.Uri.parse(s))).length === 0;
}

export class Terminator {

  private togglingPanel : boolean;
  private autoClosingEnabled : boolean;

  // The previous editor that wasn't an output editor.
  /*private previouslyActiveNonOutputEditor : vscode.Uri | undefined;
  private previouslyActiveEditorWasOutput : boolean;

  private previouslyVisibleEditors : Set<string>;*/

  constructor() {
    this.togglingPanel = false;
    this.autoClosingEnabled = true;

    /*this.previouslyActiveNonOutputEditor = (vscode.window.activeTextEditor && !isOutputUri(vscode.window.activeTextEditor.document.uri)) ? vscode.window.activeTextEditor.document.uri : undefined;
    this.previouslyActiveEditorWasOutput = false;
    this.previouslyVisibleEditors = new Set<string>();*/
  }

  activate(context: vscode.ExtensionContext) {

    this.registerCommand(context, extensionCommand("autoClosePanel.enable"), () => this.setAutoClose(true));
    this.registerCommand(context, extensionCommand("autoClosePanel.disable"), () => this.setAutoClose(false));

    this.registerCommand(context, extensionCommand("execute"), (args : ExecuteArgs) => this.execute(args));

    // This only activates when a terminal is created, focus is changed from one terminal
    // to another terminal, or all terminals are terminated (aka permanently closed).
    // Unfortunately, it does not help with the scenario of switching between text editors and terminals.
    // context.subscriptions.push(vscode.window.onDidChangeActiveTerminal((t : vscode.Terminal | undefined) => {}));

    // This event only triggers when a new terminal is created.
    // context.subscriptions.push(vscode.window.onDidOpenTerminal((activeEditor) => {}));

    // This is activated when a file is opened (via File Explorer or ctrl+click in terminal) from
    // the panel view. Those actions cause a half-open page and half-open panel.
    // This event notices that the visible ranges of the files changed and closes the terminal.
    this.register(context, vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
      if (!isOutputUri(event.textEditor.document.uri) && event.visibleRanges.length) {
        this.closePanel(false, "TextEditorVisibleRange");
      }
    }));

    /*this.register(context, vscode.window.onDidChangeVisibleTextEditors((visibleEditors) => {
      const newlyVisibleEditors = new Set(visibleEditors.map(ve => ve.document.uri.toString()));

      if (!visibleEditors.length) {
        this.previouslyVisibleEditors = newlyVisibleEditors;
        return;
      }

      if (visibleEditors.filter(ve => isOutputUri(ve.document.uri)).length === 0) {
        this.previouslyVisibleEditors = newlyVisibleEditors;
        return;
      }

      // If the only element added was an output editor, then skip.
      if (differenceOutputOnly(newlyVisibleEditors, this.previouslyVisibleEditors) || differenceOutputOnly(this.previouslyVisibleEditors, newlyVisibleEditors)) {
        this.previouslyVisibleEditors = newlyVisibleEditors;
        return;
      }

      // Otherwise, close the panel
      this.closePanel("VisibleTextEditors");
      this.previouslyVisibleEditors = newlyVisibleEditors;
    }));

    // This only triggers when a file is closed or focus changes. This won't
    // trigger when the terminal is open (because the active editor behind the
    // terminal is still the same).
    this.register(context, vscode.window.onDidChangeActiveTextEditor((activeEditor) => {
      if (!activeEditor) {
        return;
      }

      // Never close panel when switching to output focus (since output pane lives in the panel).
      if (isOutputUri(activeEditor.document.uri)) {
        this.previouslyActiveEditorWasOutput = true;
        return;
      }

      // If we were focused on fileA, then went to output, and now at fileB, then we should close.
      if (this.previouslyActiveEditorWasOutput && activeEditor.document.uri.toString() !== this.previouslyActiveNonOutputEditor?.toString()) {
        this.closePanel("fileA -> output -> fileB");
      }

      // Otherwise, if we are going from any file to any other file (even if same file), then close
      if (!this.previouslyActiveEditorWasOutput) {
        this.closePanel("fileA -> fileB");
      }

      this.previouslyActiveNonOutputEditor = activeEditor.document.uri;
      this.previouslyActiveEditorWasOutput = false;
    }));*/

    // I don't use notebooks, but I'm assuming this is useful for those who do.
    this.register(context, vscode.window.onDidChangeNotebookEditorVisibleRanges((event) => {
      if (!isOutputUri(event.notebookEditor.notebook.uri) && event.visibleRanges.length) {
        this.closePanel(false, "NotebookEditorVisibleRange");
      }
    }));

    /*this.register(context, vscode.window.onDidChangeVisibleNotebookEditors((visibleEditors) => {
      if (visibleEditors.length > 0) {
        this.closePanel("NB2");
      }
    }));
    this.register(context, vscode.window.onDidChangeActiveNotebookEditor((activeEditor) => {
      if (activeEditor) {
        this.closePanel("NB3");
      }
    }));*/

    // Command registrations
    for (const cmd of unsetCommands) {
      this.registerCommand(context, cmd, () => vscode.window.showErrorMessage(`The command "${cmd}" has been unset by the termin-all-or-nothing extension`));
    }

    for (const cmd of openCommands) {
      this.registerCommand(context, cmd, () => this.openPanel());
    }

    for (const cmd of closeCommands) {
      this.registerCommand(context, cmd, () => this.closePanel(true, "CMD:" + cmd));
    }
  }

  register(context: vscode.ExtensionContext, ...sub : { dispose(): any }[]) {
    context.subscriptions.push(...sub);
  }

  registerCommand(context: vscode.ExtensionContext, commandName: string, callback: (...args: any[]) => Thenable<any>) {
    this.register(context, vscode.commands.registerCommand(commandName, callback));
  }

  async setAutoClose(value : boolean) : Promise<void> {
    this.autoClosingEnabled = value;
  }

  async openPanel() : Promise<void> {
    if (this.togglingPanel) {
      return;
    }
    this.togglingPanel = true;
    await vscode.commands.executeCommand("workbench.action.toggleMaximizedPanel");
    this.togglingPanel = false;
  }

  async closePanel(userInitiated : boolean, id : string) : Promise<void> {
    if (this.togglingPanel) {
      return;
    }
    if (userInitiated || this.autoClosingEnabled) {
      this.togglingPanel = true;
      await vscode.commands.executeCommand("workbench.action.closePanel");
      this.togglingPanel = false;
    }
  }

  async execute(args : ExecuteArgs) {
    const oldValue : boolean = this.autoClosingEnabled;
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
