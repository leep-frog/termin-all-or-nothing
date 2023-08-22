## Release Notes

### 5.0.0

- Updated the listener to check for editors viewing the same file. The extension
now properly auto-closes the panel when opening a file that is already open in
another visible editor.

### 4.0.5

- Added support with Remote SSH (by changing this extension from a web
extension to a regular extension)

### 4.0.0

- Updated listeners to fix major issues
- Decreased auto-close delay after manual open

### 3.0.0

- Added listener for `onDidChangeVisibleTextEditors` to check for editor changes that are occasionally missed by the previous check `onDidChangeTextEditorVisibleRanges` (e.g. [this issue](https://github.com/leep-frog/termin-all-or-nothing/issues/1)).
- Added a minimum amount of time required between a user manually opening the panel and this extension automatically closing a panel. That way, we have a safe-guard against the situation where opening a panel triggers some unexpected behavior that causes this extension to quickly close the panel (which can be very frustrating).

### 2.2.0

Added `termin-all-or-nothing.autoClosePanel.[enable/disable]` commands and the
wrapper command `termin-all-or-nothing.execute`.

### 2.0.0

Added custom commands and improved listener logic.

### 1.0.4

Close panel on more listener events.

### 1.0.1

Updated callback to `vscode.window.onDidChangeVisibleTextEditors`.


### 1.0.0

Initial release. Deals with `File Explorer Click` case.
