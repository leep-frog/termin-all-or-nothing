# termin-all-or-nothing

This extension (primarily written to solve [this problem](https://github.com/microsoft/vscode/issues/131319)) does its best to prevent your vscode editor from ever becoming half editor, half terminal. Any time that split can occur,
this extension either fully opens or fully closes the terminal.

## All-or-Nothing Cases

This extension hides the terminal whenever editor focus changes.
Below are a few of the primary use cases considered:

 - File Explorer click from terminal focus
 - Open file from Quick Open
## Contribute

This is a relatively simple extension so feel free to open issues or
pull requests, and I'll try to respond in a timely manner.

## Appreciate

I find it very rewarding to know that my projects made someone's day or
developer life a little better. If you feel so inclined, either star this repo
or [buy my a coffee](https://paypal.me/sleepfrog) so I know my project helped
you out!

## Release Notes

### 1.0.4

Close panel on more listener events.

### 1.0.1

Updated callback to `vscode.window.onDidChangeVisibleTextEditors`.


### 1.0.0

Initial release. Deals with `File Explorer Click` case.
