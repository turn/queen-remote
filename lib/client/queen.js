var EventEmitter = require("events").EventEmitter,
	net = require('net'),
	jot = require('json-over-tcp'),
	generateId = require('node-uuid').v4,
	its = require('its');

var Workforce = require('./workforce.js').Workforce,
	createWorkforce = require('./workforce.js').create,
	createWorkerProvider = require('./workerProvider.js').create,
	utils = require('../utils.js'),
	MESSAGE_TYPE = require('../protocol.js').QUEEN_MESSAGE_TYPE;
	
var create = module.exports = function(callback, options){
	options = options || {};
	var socket = options.socket || new jot.Socket(),
		queen = new Queen(socket),
		host = options.host || "",
		hostArr = host.split(":"),
		hostname = hostArr[0],
		port = hostArr[1] || 9200;

	if(options.log) queen.log = options.log;
	if(options.debug) queen.debug = options.debug;
	if(options.trackWorkerProviders) queen.trackWorkerProviders = options.trackWorkerProviders === true;
	if(port) queen.port = port;
	if(hostname) queen.host = hostname;

	var callbackCalled = false;
	function onReady(queen, err){
		if(callbackCalled) return;
		callback(queen, err);
		callbackCalled = true;
	}

	queen.onReady = onReady;
	queen.api.on('dead', function(reason){
		onReady(void 0, reason);
	});

	queen.connect();
	return queen.api;
};

var Queen = exports.Queen = function(socket){
	var self = this;

	its.object(socket, "Socket must be defined");
	this.socket = socket;
	this.emitter = new EventEmitter();
	this.workforceEmitters = {};
	this.workerProviders = {};
	this.workerProviderEmitters = {};
	this.continuousWorkforces = {};

	this.kill = utils.once(this.kill.bind(this));

	this.getWorkerProvider = this.getWorkerProvider.bind(this); // used by workforces

	socket.on('data', this.messageHandler.bind(this));
	socket.on('close', function(){self.kill('socket closed');});
	socket.on('end', function(){self.kill('socket closed');});
	socket.on('error', function(e){self.kill('socket error: ' + e.message);});
	
	Object.defineProperty(this, "api", { 
		value: Object.freeze(getApi.call(this)),
		enumerable: true 
	});
};

var getApi = function(){
	var self = this,
		api = this.getWorkforce.bind(this);

	api.on = this.emitter.on.bind(this.emitter);
	api.removeListener = this.emitter.removeListener.bind(this.emitter);
	api.kill = this.kill;
	
	Object.defineProperty(api, 'workerProviders', {
		enumerable: true,
		get: function(){
			return utils.values(self.workerProviders);
		}
	});

	return api;
};

Queen.prototype.port = 9200;
Queen.prototype.host = "localhost";
Queen.prototype.trackWorkerProviders = false;

Queen.prototype.log = utils.noop;
Queen.prototype.debug = utils.noop;
Queen.prototype.onReady = utils.noop;

Queen.prototype.sendToSocket = function(message){
	this.socket.write(message);
};

Queen.prototype.connect = function(){
	this.socket.connect(this.port, this.host, this.connectionHandler.bind(this));
};

Queen.prototype.connectionHandler = function(){
	if(this.trackWorkerProviders){
		this.sendToSocket([
			MESSAGE_TYPE['track worker providers'],
			trackWorkerProviders
		]);
	}
};

Queen.prototype.kill = function(reason){
	utils.each(this.workforces, function(workforce){
		workforce.kill();
	});
	this.emitter.emit('dead', reason);
	this.emitter.removeAllListeners();
	this.socket.end();
};

Queen.prototype.messageHandler = function(message){
	switch(message[0]){
		case MESSAGE_TYPE['workforce message']:
			this.workforceMessage(message[1], message[2]);
			break;

		case MESSAGE_TYPE['worker provider message']:
			this.workerProviderMessage(message[1], message[2]);
			break;

		case MESSAGE_TYPE['create worker provider']:
			this.createWorkerProvider(message[1], message[2]);
			break;

		case MESSAGE_TYPE['ready']:
			this.ready = true;
			this.onReady(this.api);
			break;

		default:
			break;
	}
};

Queen.prototype.workforceMessage = function(workforceId, message){
	var workforceEmitter = this.workforceEmitters[workforceId];
	
	if(workforceEmitter === void 0) return;
	
	workforceEmitter.emit('message', message);
};

Queen.prototype.workerProviderMessage = function(workerProviderId, message){
	var workerProviderEmitter = this.workerProviderEmitters[workerProviderId];

	if(workerProviderEmitter === void 0) return;

	workerProviderEmitter.emit("message", message);
};

Queen.prototype.getWorkerProvider = function(id){
	return this.workerProviders[id];
};

Queen.prototype.getWorkerProviders = function(filter){
	if(!filter) return utils.values(this.workerProviders);
	
	return utils.filter(this.workerProviders, function(workerProvider){
		return filter(workerProvider.attributes);
	});
};

Queen.prototype.createWorkerProvider = function(id, attributes){
	var	self = this, 
		workerProviderEmitter = new EventEmitter(),
		workerProvider = createWorkerProvider(id, workerProviderEmitter, attributes);

	this.workerProviderEmitters[id] = workerProviderEmitter;
	this.workerProviders[id] = workerProvider;

	workerProvider.on('dead', function(){
		self.log('Worker provider dead: ' + workerProvider);
		delete self.workerProviderEmitters[id];
		delete self.workerProviders[id];
	});

	this.log('New worker provider: ' + workerProvider + "\n");
	this.emitter.emit('workerProvider', workerProvider);

	utils.each(this.continuousWorkforces, function(workforce){
		workforce.populate(workerProvider);
	});
};

Queen.prototype.getWorkforce = function(config){
	var self = this,
		populate = config.populate,
		autoStart = config.autoStart,
		workforceId = generateId(),
		workforceEmitter = new EventEmitter(),
		workforce,
		onSendToSocket;
	
	onSendToSocket = function(message){
		self.sendToSocket([
			MESSAGE_TYPE['workforce message'],
			workforceId,
			message
		]);
	};

	workforce = createWorkforce(this.getWorkerProvider, workforceEmitter, onSendToSocket, {
		workerHandler: config.handler,
		stopHandler: config.stop,
		providerFilter: config.filter,
		killOnStop: config.killOnStop
	});

	if(config.workforceTimeout){
		timeout = setTimeout(function(){
			workforce.kill("timeout");
		}, config.workforceTimeout);

		workforce.api.on('dead', function(){
			clearTimeout(timeout);
		});

		delete config.workforceTimeout;
	}

	workforce.api.on('dead', function(){
		self.debug('Workforce dead');
		delete self.workforceEmitters[workforceId];
	});

	workforce.api.on('start', function(){
		workforce.populate(self.getWorkerProviders());

		if(populate === "continuous"){
			self.continuousWorkforces[workforceId] = workforce;			
			workforce.api.on('dead', function(){
				delete self.continuousWorkforces[workforceId];
			});
		}
	});

	this.workforceEmitters[workforceId] = workforceEmitter;

	config.populate = "manual"; // population is done on this side of the connection
	config.killOnStop = false; // killing is controlled on this side
	config.autoStart = false;
	this.sendToSocket([
		MESSAGE_TYPE['create workforce'],
		workforceId,
		config
	]);

	if(autoStart !== false){
		workforce.start();
	}

	this.debug('New workforce');
	this.emitter.emit('workforce', workforce.api);

	return workforce.api;
};