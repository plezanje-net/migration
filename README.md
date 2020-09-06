plezanje-cli
============



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/plezanje-cli.svg)](https://npmjs.org/package/plezanje-cli)
[![Downloads/week](https://img.shields.io/npm/dw/plezanje-cli.svg)](https://npmjs.org/package/plezanje-cli)
[![License](https://img.shields.io/npm/l/plezanje-cli.svg)](https://github.com/demshy/plezanje-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g plezanje-cli
$ plezanje-cli COMMAND
running command...
$ plezanje-cli (-v|--version|version)
plezanje-cli/0.0.0 win32-x64 node-v12.18.3
$ plezanje-cli --help [COMMAND]
USAGE
  $ plezanje-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`plezanje-cli hello [FILE]`](#plezanje-cli-hello-file)
* [`plezanje-cli help [COMMAND]`](#plezanje-cli-help-command)

## `plezanje-cli hello [FILE]`

describe the command here

```
USAGE
  $ plezanje-cli hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ plezanje-cli hello
  hello world from ./src/hello.ts!
```

_See code: [src\commands\hello.ts](https://github.com/demshy/plezanje-cli/blob/v0.0.0/src\commands\hello.ts)_

## `plezanje-cli help [COMMAND]`

display help for plezanje-cli

```
USAGE
  $ plezanje-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src\commands\help.ts)_
<!-- commandsstop -->
