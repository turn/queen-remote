# Queen-Remote [![Build Status](https://secure.travis-ci.org/ozanturgut/queen-remote.png?branch=master)](http://travis-ci.org/ozanturgut/queen-remote)

**Write [Queen](http://queenjs.com) applications which run Queen Scripts on a remote Queen Server.**

This library provides the tooling required to write Queen applications which can utilize a remote
[Queen Server](https://github.com/ozanturgut/queen) as if it were local. This is particularly useful in creating thin-client applications 
which harness the full power of Queen. This package also comes with the `queen-remote` executable, 
allowing you to execute Queen Scripts remotely through a remote Queen Server.

## Running [Queen Scripts](https://github.com/ozanturgut/queen/wiki/Writing-Queen-Scripts) Remotely
1. Install queen-remote: `npm install -g queen-remote`
2. Run your script `queen-remote -h queen.turn.com:9200 http://queenjs.com/server-example.js

This will establish a connection to the Queen Server running at queen.turn.com:9200, and execute
the server-example.js Queen Script on it with all of it's captured browsers.

## Command line Options

### ```[path]``` _queenConfig.js by default_

This can either be a local file path, or a URL. The file can either be a [Queen config file](https://github.com/ozanturgut/queen/wiki/Queen-Config-File), or
a Queen script.

```
// Example
// Starts Queen with configuration defined in queenConfig.js 
// if it exists in the current directory, or defaults otherwise
queen

// Starts Queen with a configuration file that is not named queenConfig.js
queen my-config-file.js

// Starts Queen with default options and executes the my-queen-script.js when Queen is ready
queen my-queen-script.js
```

If the file is a [Queen config file](https://github.com/ozanturgut/queen/wiki/Queen-Config-File), it will be used to configure this queen instance.

If the file is a Queen server-side script, queen will disable it's remote server and execute 
the server-side script.

### ```-h [host]``` (also `--host`)  _port 9200 on all hosts by default_

The host to bind the remote server to. This is the address queen-remote clients will connect to.

```
// Example
// Starts queen, listening to port 9283 on host queen.turn.com for 
// remote connections (assumes queen.turn.com points to this machine
queen -h queen.turn.com:9283
```

### ```-c [host]``` (also `--capture`) _[Internal IP Address]:80 by default_

The address to bind the capture server to. Browsers will navigate to the url + "/capture.html" to connect to Queen.

```
// Example
// Starts queen, listening to port 4848 on localhost for browsers. This would allow
// browsers to connect to this Queen Server by navigating to http://localhost:4848
queen -c localhost:4848
```

### `-r [host]` (also `--remote`) _Disabled by default_

Allows you to connect to a another Queen server to execute code. Setting this option disables the `-h` and `-c` commands, since one Queen instance can't act both as a client and a server at the same time. 

If the machine you're using this command on doesn't need to start it's own Queen Server, use [`queen-remote`](https://github.com/ozanturgut/queen-remote) instead, it does the same thing for a fraction of the package size (250 KB instead of 18 MB).

```
// Example
// Connects to a Queen server running on queen.turn.com, port 9200 and 
// executes the script at http://queenjs.com/server-example.js
queen -r queen.turn.com:9200 http://queenjs.com/server-example.js

// Does the exact same thing, without requiring the entire queen package
queen-remote -h queen.turn.com:9200 http://queenjs.com/server-example.js
```

### ```--heartbeatInterval <n>``` _60000 milliseconds (60 seconds) by default_

Milliseconds clients have to send a heartbeat until they're considered unresponsive.

```
// Example
// Starts queen with heartbeat checks disabled
queen --heartbeatInterval 0
```

### ```-v``` or ```--verbose```

Enable debug logging.

### ```-q``` or ```--quiet```

Supress logging.

## Programmatic API
Importing this module via `require('queen-remote')` will give you an object with the following properties.

* `client` - This is an object which implements 
the [Queen module API](https://github.com/ozanturgut/queen/wiki/Server-API#wiki-module) and takes an additional
"host" variable in it's options object -- the host of the remote server. So long as you give it the host,
you can do all the things you can do with the a real Queen Server API with it.
* `server` - A RPC server that the Queen Server uses to accept connections from queen-remote clients.
* `runner` - The runner function that both Queen Server and Queen Remote uses to start up via their command line
interfaces.
