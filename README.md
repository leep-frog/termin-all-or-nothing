# termin-all-or-nothing

This extension (primarily written to solve [this problem](https://github.com/microsoft/vscode/issues/131319))
does its best to prevent your vscode editor from ever becoming a cyborg
(half editor, half terminal). Any time that split can occur, this extension
either fully opens or fully closes the terminal.

## Setup

Install this extension and add the following keybindings to your
`keybindings.json` file (replacing `key` with whatever key(s) you use to
toggle between the editor and terminal):

```jsonc
{
  "key": "ctrl+t",
  "command": "termin-all-or-nothing.closePanel",
  "when": "activePanel"
},
{
  "key": "ctrl+t",
  "command": "termin-all-or-nothing.openPanel",
  "when": "!activePanel"
}
```

Additionally, update the following field in your settings:

```jsonc
"terminal.integrated.commandsToSkipShell": [
  // ...
  "termin-all-or-nothing.closePanel"
],
```

## All-or-Nothing Cases

There are many ways that a terminal/editor can be opened in VS Code. This
extension has considered the following cases:

 - `termin-all-or-nothing.[open/Close]Panel` commands
 - File Explorer single-click on currently unopened file during terminal
   focus (closes terminal)
 - File Explorer double-click on currently unopened file during terminal
   focus (closes terminal)
 - File Explorer double-click on already opened file during terminal
   focus (closes terminal)
 - Ctrl+click on currently unopened file in terminal (closes terminal)
 - Ctrl+click on open file in terminal (closes terminal)

> If there are any other cases you'd like this extension to consider, please
[open an issue for it](https://github.com/leep-frog/termin-all-or-nothing/issues).

## Known Issues & Fixes

### Output Tab Closes Immediately After Opening

Based on the available listeners (or lack thereof) in the VS Code API and how
this extension was implemented, there is one major issue to callout;
specifically, whenever a VS Code command or execution simultaneously (1) sends
data to the output tab *and* (2) switches focus to the output tab, then the
panel is automatically closed (thus undoing the intentional focus switch done
by (2)).

There are two simple fixes to this:

1. Simply run `termin-all-or-nothing.openPanel` again, and you will be brought
back to the output tab in the panel view just fine.

2. Wrap the vscode command that causes this issue with the
`termin-all-or-nothing.execute` command. For example, if this is your
regular command that encounters the issue:

```jsonc
{
  "key": "ctrl+x ctrl+t",
  "command": "go.test.package",
  "args": {
    "arg1": "value1",
    "arg2": ["value", "2"],
    // etc.
  },
},
```

then you should simply wrap the `command` and `args` fields one level deeper
like the following:

```jsonc
{
  "key": "ctrl+x ctrl+t",
  "command": "termin-all-or-nothing.execute",
  "args": {
    // This value defaults to false, but is shown here as an fyi.
    "autoCloseEnabled": false,
    // Original command and arguments:
    "command": "go.test.package",
    "args": {
      "arg1": "value1",
      "arg2": ["value", "2"],
      // etc.
    },
  },
},
```

### Panel Closing After Running VS Code Commands

Occassionally, running built-in commands (e.g.
`workbench.action.toggleMaximizedPanel`) will open the panel and then
immediately close it. This can be fixed by the same two solutions recommended
in the previous section, or by switching any keybinding that runs these commands
to execute `termin-all-or-nothing.[open/close]Panel` instead.

I find the following two keybindings to be sufficient for manually opening
and closing the panel:

```jsonc
{
  "key": "ctrl+t",
  "command": "termin-all-or-nothing.openPanel",
  "when": "!activePanel"
},
{
  "key": "ctrl+t",
  "command": "termin-all-or-nothing.closePanel",
  "when": "activePanel"
},
```

## Contribute

Feel free to
[open issues](https://github.com/leep-frog/termin-all-or-nothing/issues) or
[pull requests](https://github.com/leep-frog/termin-all-or-nothing/pulls),
and I'll do my best to respond in a timely manner.

## Appreciate

I find it very rewarding to know that my projects made someone's day or
developer life a little better. If you feel so inclined, leave a review
or [buy my a coffee](https://paypal.me/sleepfrog) so I know my project helped
you out!

## Release Notes

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
