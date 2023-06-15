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

- [Release Notes](https://github.com/leep-frog/termin-all-or-nothing/blob/main/ReleaseNotes.md)
- [FAQs (Common Issues & Solutions)](https://github.com/leep-frog/termin-all-or-nothing/blob/main/FAQ.md)
