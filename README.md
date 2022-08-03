# termin-all-or-nothing

This extension (primarily written to solve [this problem](https://github.com/microsoft/vscode/issues/131319)) does its best to prevent your vscode editor from ever becoming half editor, half terminal. Any time that split can occur,
this extension either fully opens or fully closes the terminal.

## All-or-Nothing Cases

### File Explorer Click

When clicking a file in the File Explorer, this extension will automatically close
the terminal.

## Release Notes

### 1.0.0

Initial release. Deals with `File Explorer Click` case.
