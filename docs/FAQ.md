# Known Issues & Fixes

## Output Tab Closes Immediately After Opening [Solutions Provided]

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

## Panel Closing After Running VS Code Commands [Solutions Provided]

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

## Auto-Closes Panel on Change to Open File [Pending Solution]

When you are in the panel and an open file is changed (e.g. by running
something like `echo "add" >> openFile.txt` or some file-editting script),
then the panel will auto-close. Unfortunately, this is a side-effect of how this
extension is implemented. I am considering fixes for this, but have yet to
find a solution that closes this issue without introducing other ones.
