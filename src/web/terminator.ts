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

export class Terminator {

  private togglingPanel : boolean;

  constructor() {
    this.togglingPanel = false;
  }

  activate(context: vscode.ExtensionContext) {

    // This only activates when a terminal is created, focus is changed from one terminal
    // to another terminal, or all terminals are terminated (aka permanently closed).
    // Unfortunately, it does not help with the scenario of switching between text editors and terminals.
    // context.subscriptions.push(vscode.window.onDidChangeActiveTerminal((t : vscode.Terminal | undefined) => {}));

    // This event only triggers when a new terminal is created.
    // context.subscriptions.push(vscode.window.onDidOpenTerminal((activeEditor) => {}));

    context.subscriptions.push(vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
      if (event.visibleRanges.length) {
        this.closePanel();
      }
    }));
    context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors((visibleEditors) => {
      if (visibleEditors.length) {
        this.closePanel();
      }
    }));

    // This only triggers when a file is closed or focus changes. This won't
    // trigger when the terminal is open (because the active editor behind the
    // terminal is still the same).
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((activeEditor) => {
      if (activeEditor) {
        this.closePanel();
      }
    }));

    // I don't use notebooks, but I'm assuming this is useful for those who do.
    context.subscriptions.push(vscode.window.onDidChangeNotebookEditorVisibleRanges((event) => {
      // Only close the panel if there are some visible editors.
      if (event.visibleRanges.length > 0) {
        this.closePanel();
      }
    }));
    context.subscriptions.push(vscode.window.onDidChangeVisibleNotebookEditors((visibleEditors) => {
      if (visibleEditors.length > 0) {
        this.closePanel();
      }
    }));
    context.subscriptions.push(vscode.window.onDidChangeActiveNotebookEditor((activeEditor) => {
      if (activeEditor) {
        this.closePanel();
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
        this.closePanel();
      }));
    }
  }

  async closePanel() : Promise<void> {
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
