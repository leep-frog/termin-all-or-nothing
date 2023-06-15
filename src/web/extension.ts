import * as vscode from "vscode";
import { Terminator } from "./terminator";

const terminator = new Terminator();

export function activate(context: vscode.ExtensionContext) {
  terminator.activate(context);
}

export function deactivate(): void { }
