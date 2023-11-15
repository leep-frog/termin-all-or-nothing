# termin-all-or-nothing

This extension (primarily written to solve [this problem](https://github.com/microsoft/vscode/issues/131319))
does its best to prevent your vscode editor from ever becoming a cyborg
(half editor, half terminal). Any time that split can occur, this extension
either fully opens or fully closes the terminal.

## Setup

The extension should start working automatically after installation.

It is also recommended to update your preferred keyboard
binding (in `keybindings.json`) for panel toggling to use the
VS Code command
`workbench.action.toggleMaximizedPanel` (as opposed to
`workbench.action.togglePanel`) to ensure that you
are always fully opening or closing the panel. For example,

```json
  {
    "key": "ctrl+t",
    "command": "workbench.action.toggleMaximizedPanel"
  },
```

## All-or-Nothing Cases

There are many ways that a terminal/editor can be opened in VS Code. This
extension has considered the following cases:

### Open from File Explorer

> Opening via both single-click and double-click works.

![](./docs/gifs/FileExplorerOpen.gif)

### Open from Command Prompt

![](./docs/gifs/PromptFromTerminal.gif)

### Ctrl+click on file reference from terminal

![](./docs/gifs/CtrlClickFromTerminal.gif)

### Running `code new-file.txt` from the integrated terminal

![](./docs/gifs/CodeCommandFromTerminal.gif)

> If there are any other cases you'd like this extension to consider, please
[open an issue for it](https://github.com/leep-frog/termin-all-or-nothing/issues).

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

## Further Reading

- [Release Notes](https://github.com/leep-frog/termin-all-or-nothing/blob/main/docs/ReleaseNotes.md)
- [FAQs (Known Issues)](https://github.com/leep-frog/termin-all-or-nothing/blob/main/docs/FAQ.md)
