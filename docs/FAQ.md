# Known Issues & Fixes

## Focusing on Already Open File

When initiating an action that focuses on a file that is already open, the terminal-editor split occurs and is not auto-closed.

This can happen when
- You click on an already open in the File Explorer from the terminal screen
- You run `code filename.txt` from the integrated terminal (and `filename.txt` is already in an existing, but non-visible editor).
- You ctrl+click an alreay open file from the integrated terminal.
