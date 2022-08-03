// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // If part of a file is now visible, close the terminal.
  context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(() => {
    vscode.commands.executeCommand("workbench.action.closePanel");
  }));

  // This only triggers when a file is closed or focus changes. This won't
  // trigger when the terminal is open (because the active editor behind the
  // terminal is still the same).
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
    vscode.commands.executeCommand("workbench.action.closePanel");
  }));

  // I don't use notebooks, but I'm assuming this is useful for those who do.
  context.subscriptions.push(vscode.window.onDidChangeVisibleNotebookEditors(() => {
    vscode.commands.executeCommand("workbench.action.closePanel");
  }));
  context.subscriptions.push(vscode.window.onDidChangeActiveNotebookEditor(() => {
    vscode.commands.executeCommand("workbench.action.closePanel");
  }));
}

// this method is called when your extension is deactivated
export function deactivate() { }
