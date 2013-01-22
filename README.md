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
### ```-h [host]``` (also `--host`)  _port 9200 on the current IP address by default_

The host of the Queen Server to connect to.

```
// Example
// Starts queen-remote and connect to a Queen Server running at queen.turn.com:9283
queen-remote -h queen.turn.com:9283
```


### ```-p [host]``` (also `--proxy`)

Sets up this queen-remote instance to pretend to be a Queen Server which other queen-remote applications
can connect to. It will act as a proxy to the real Queen Server and relay communications accordingly.

```
// Example
// Starts queen-remote and connect to a Queen Server running at queen.turn.com:9283
// then starts listening on localhost:9122 for other queen-remote instances to connect to this server
// when they do, it will relay their requests to queen.turn.com:9283
queen-remote -h queen.turn.com:9283 -p localhost:9122
```

### ```[path]``` _queenConfig.js by default_

This can either be a local file path, or a URL. The file can either be a [Queen config file](https://github.com/ozanturgut/queen/wiki/Queen-Config-File), or
a Queen script.

```
// Example
// These examples all try to connect to a Queen Server running on localhost:9200

// Starts Queen Remote with configuration defined in queenConfig.js 
// if it exists in the current directory, or defaults otherwise
queen-remote -h localhost:9200

// Starts Queen Remote with a configuration file that is not named queenConfig.js
queen-remote -h localhost:9200 my-config-file.js

// Starts Queen Remote with default options and executes the my-queen-script.js when Queen is ready
queen-remote -h localhost:9200 my-queen-script.js
```

If the file is a [Queen config file](https://github.com/ozanturgut/queen/wiki/Queen-Config-File), it will be used to configure this queen instance.

If the file is a Queen server-side script, queen will disable it's remote server and execute 
the server-side script.

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
