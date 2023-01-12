import * as vscode from 'vscode';

const unsetCommands : string[] = [
  // Don't override this because we call it ourselves.
  // "workbench.action.toggleMaximizedPanel",
];
const openCommands = [
  "terminal.focus",
  "termin-all-or-nothing.openPanel",
  "workbench.action.terminal.toggleTerminal",
];
const closeCommands = [
  "termin-all-or-nothing.closePanel",
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

  // The previous editor that wasn't an output editor.
  private previouslyActiveNonOutputEditor : vscode.Uri | undefined;
  private previouslyActiveEditorWasOutput : boolean;

  private previouslyVisibleEditors : Set<string>;

  constructor() {
    this.togglingPanel = false;

    this.previouslyActiveNonOutputEditor = (vscode.window.activeTextEditor && !isOutputUri(vscode.window.activeTextEditor.document.uri)) ? vscode.window.activeTextEditor.document.uri : undefined;
    this.previouslyActiveEditorWasOutput = false;
    this.previouslyVisibleEditors = new Set<string>();
  }

  activate(context: vscode.ExtensionContext) {

    // This only activates when a terminal is created, focus is changed from one terminal
    // to another terminal, or all terminals are terminated (aka permanently closed).
    // Unfortunately, it does not help with the scenario of switching between text editors and terminals.
    // context.subscriptions.push(vscode.window.onDidChangeActiveTerminal((t : vscode.Terminal | undefined) => {}));

    // This event only triggers when a new terminal is created.
    // context.subscriptions.push(vscode.window.onDidOpenTerminal((activeEditor) => {}));

    context.subscriptions.push(vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
      if (event.textEditor.document.uri.scheme !== "output" && event.visibleRanges.length) {
        this.closePanel("TextEditorVisibleRange");
      }
    }));

    context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors((visibleEditors) => {
      const newlyVisibleEditors = new Set(visibleEditors.map(ve => ve.document.uri.toString()));

      if (!visibleEditors.length) {
        this.previouslyVisibleEditors = newlyVisibleEditors;
        return;
      }

      if (visibleEditors.filter(ve => ve.document.uri.scheme !== "output").length === 0) {
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
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((activeEditor) => {
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
    }));

    // I don't use notebooks, but I'm assuming this is useful for those who do.
    context.subscriptions.push(vscode.window.onDidChangeNotebookEditorVisibleRanges((event) => {
      // Only close the panel if there are some visible editors.
      if (event.visibleRanges.length > 0) {
        this.closePanel("NB1");
      }
    }));
    context.subscriptions.push(vscode.window.onDidChangeVisibleNotebookEditors((visibleEditors) => {
      if (visibleEditors.length > 0) {
        this.closePanel("NB2");
      }
    }));
    context.subscriptions.push(vscode.window.onDidChangeActiveNotebookEditor((activeEditor) => {
      if (activeEditor) {
        this.closePanel("NB3");
      }
    }));

    // Command registrations
    for (const cmd of unsetCommands) {
      context.subscriptions.push(vscode.commands.registerCommand(cmd, () => {
        vscode.window.showErrorMessage(`The command "${cmd}" has been unset by the termin-all-or-nothing extension`);
      }));
    }

    for (const cmd of openCommands) {
      context.subscriptions.push(vscode.commands.registerCommand(cmd, () => {
        this.openPanel();
      }));
    }

    for (const cmd of closeCommands) {
      context.subscriptions.push(vscode.commands.registerCommand(cmd, () => {
        this.closePanel("CMD:" + cmd);
      }));
    }
  }

  async closePanel(id : string) : Promise<void> {
    if (this.togglingPanel) {
      return;
    }
    this.togglingPanel = true;
    await vscode.commands.executeCommand("workbench.action.closePanel");
    this.togglingPanel = false;
  }

  async openPanel() : Promise<void> {
    if (this.togglingPanel) {
      return;
    }
    this.togglingPanel = true;
    await vscode.commands.executeCommand("workbench.action.toggleMaximizedPanel");
    this.togglingPanel = false;
  }
}
