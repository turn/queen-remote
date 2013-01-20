var tty = require('tty'),
	path = require('path'),
	http = require('http'),
	vm = require('vm'),
	fs = require('fs');

var utils = require('../utils.js'),
	createQueenRemoteServer = require("../server/server.js");

var runner = module.exports = function(queenFactory, config, callback){
	if(!config) throw new Error('Config must be defined');
	callback = callback || utils.noop;

	tryToLoadConfigModule(config);

	// This fills any default properties to the config object (if they're not defined)
	var defaults = require('../../config/runner.json');
	setDefaults(config, defaults);

	// Collapse the config options and default options in to one variable
	var log = config.log = config.quiet? utils.noop : process.stdout.write.bind(process.stdout),
		debug = config.debug = config.verbose? process.stdout.write.bind(process.stdout) : utils.noop;

	log("[Queen] Starting...\n");
	debug("[Queen] Verbose logging enabled\n");
	queenFactory({
		callback: function(queen){
			configureQueenServer(queen, config, callback);
		},
		remoteHost: config.remoteHost,
		captureHost: config.capture,
		heartbeatInterval: config.heartbeatInterval,
		log: log,
		debug: debug
	});
};

// This tried to load a config module defiend in config.module and merge it to the given
// object
function tryToLoadConfigModule(config){
	// A queen.js file may pass in a default "base" queen.js file to use for default values
	// This only goes one level down, if the defaults file defines a defaults file, it won't be
	// evaluated.
	if(config.config) config.module = config.config;

	var configModule;
	if(config.module){
		try { 
			configModule = require(config.module);
		} catch(e){
			console.error("[Queen] Unable to load config module: " + config.module);
			throw e;
		}
	} else {
		// Try to see if there is a queenConfig.js file
		try{
			configModule = require(path.resolve(process.cwd(), "queenConfig.js"));
		} catch(e){
			// It's ok if this errors, because it's optional
		}
	}

	if(configModule){
		if(typeof configModule === "function"){
			config.script = configModule;
		} else if(typeof configModule === "object"){
			setDefaults(config, configModule);
		}
	}
}

function configureQueenServer(queen, config, callback){
	if(queen instanceof Error){
		log(err);
		return callback(false);
	}

	var log = config.log,
		debug = config.debug;

	process.on('exit', queen.kill); // Won't work on Windows

	utils.each(config.plugin, function(factory, name){
		log("[Queen] Initializing plugin: " + name + "\n");
		factory(queen, config, {
			log: log,
			debug: debug
		});
	});
	
	if(config.script){	
		try{
			config.script(queen);	
		} catch(e){
			console.error("[Queen] Error occurred when executing script.");
			throw e;
		}
	} else {
		var remoteServer = createQueenRemoteServer(queen, {
			host: config.remoteServerHost || getExternalIpAddress(),
			log: log,
			debug: debug
		});

		callback(queen);
	}
}

// Returns an IP address for this machine. Modified from: http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
function getExternalIpAddress(){
	var interfaces = require('os').networkInterfaces(),
		addresses = [];

	utils.each(interfaces, function(interf, name){
		addresses = addresses.concat(
			utils.filter(interf, function(node){
				return node.family === "IPv4" && node.internal === false;
			})
		);
	});

	if(addresses.length > 0){
		return addresses[0].address;
	}
}

// Fills in obj with defaults' variables if obj doesn't already define it.
function setDefaults(obj, defaults){
	var variable;
	utils.each(defaults, function(value, key){
		if(obj[key] === void 0) obj[key] = value;
	});
	
	return obj;
}
