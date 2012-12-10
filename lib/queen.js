var _ = require("underscore"),
	EventEmitter = require("events").EventEmitter,
	net = require('net'),
	jot = require('json-over-tcp'),
	generateId = require('node-uuid').v4,
	precondition = require('precondition');

var Workforce = require('./workforce.js').Workforce,
	createWorkforce = require('./workforce.js').create,
	createWorkerProvider = require('./workerProvider.js').create,
	utils = require('./utils.js');
	
exports.create = function(callback, options){
	
	options = options || {};
	var socket = options.socket || new jot.Socket(),
		queen = new Queen(socket);

	if(options.logger) queen.log = options.logger;
	if(options.trackWorkerProviders) queen.trackWorkerProviders = options.trackWorkerProviders === true;
	if(options.port) queen.port = options.port;
	if(options.host) queen.host = options.host;

	queen.onReady = callback;

	queen.connect();
};

var Queen = exports.Queen = function(socket){
	this.socket = socket;
	this.emitter = new EventEmitter();
	this.workforceEmitters = {};
	this.workerProviders = {};
	this.workerProviderEmitters = {};
	this.continuousWorkforces = {};

	this.kill = _.once(this.kill.bind(this));

	this.getWorkerProvider = this.getWorkerProvider.bind(this); // used by workforces

	socket.on('data', this.messageHandler.bind(this));

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
			return _.values(self.workerProviders);
		}
	});

	return api;
};

Queen.prototype.port = 8099;
Queen.prototype.host = "localhost";
Queen.prototype.trackWorkerProviders = false;

Queen.prototype.log = utils.noop;
Queen.prototype.onReady = utils.noop;

Queen.prototype.sendToSocket = function(message){
	this.socket.write(message);
};

Queen.prototype.connect = function(){
	this.socket.connect(this.port, this.host, this.connectionHandler.bind(this));
};

Queen.prototype.connectionHandler = function(){
	if(this.trackWorkerProviders){
		this.sendToSocket({
			type: "trackWorkerProviders",
			value: trackWorkerProviders
		});
	}
};

Queen.prototype.kill = function(){
	_.each(this.workforces, function(workforce){
		workforce.kill();
	});
	
	this.emitter.emit('dead');
	this.emitter.removeAllListeners();
};

Queen.prototype.messageHandler = function(message){
	var workforceEmitter,
		workerProviderEmitter;
	
	if(message.workforceId !== void 0){
		workforceEmitter = this.workforceEmitters[message.workforceId];
		if(workforceEmitter === void 0){
			//this.log('Data handler error, no workforce found' + JSON.stringify(message));
			return;
		}
		workforceEmitter.emit('message', message);
	} else if(message.type === "workerProvider"){
		this.workerProviderHandler(message);
	} else if(message.workerProviderId !== void 0){
		var workerProviderEmitter = this.workerProviderEmitters[message.workerProviderId];
		workerProviderEmitter.emit("message", message);
	} else if(message === "ready"){
		this.onReady(this.api);
	};
};

Queen.prototype.getWorkerProvider = function(id){
	return this.workerProviders[id];
};

Queen.prototype.getWorkerProviders = function(filter){
	if(!filter) return _.values(this.workerProviders);
	
	return _.filter(this.workerProviders, function(workerProvider){
		return filter(workerProvider.attributes);
	});
};

Queen.prototype.workerProviderHandler = function(message){
	var	self = this, 
		id = message.id,
		workerProviderEmitter = new EventEmitter(),
		attributes = message.attributes,
		workerProvider = createWorkerProvider(id, workerProviderEmitter, attributes);

	this.workerProviderEmitters[id] = workerProviderEmitter;
	this.workerProviders[id] = workerProvider;

	workerProvider.on('dead', function(){
		self.log('Worker provider dead: ' + workerProvider.attributes.name);
		delete self.workerProviderEmitters[id];
		delete self.workerProviders[id];
	});

	this.log('New worker provider: ' + workerProvider.attributes.name);
	this.emitter.emit('workerProvider', workerProvider);

	_.each(this.continuousWorkforces, function(workforce){
		workforce.populate(workerProvider);
	});
};

Queen.prototype.getWorkforce = function(workerConfig){
	var self = this,
		populate = workerConfig.populate,
		workforceId = generateId(),
		workforceEmitter = new EventEmitter(),
		workforce,
		onSendToSocket;
		
	onSendToSocket = function(message){
		message.workforceId = workforceId;
		self.sendToSocket(message);
	};

	workforce = createWorkforce(this.getWorkerProvider, workforceEmitter, onSendToSocket, {
		workerHandler: workerConfig.handler,
		stopHandler: workerConfig.stop,
		providerFilter: workerConfig.filter,
		killOnStop: workerConfig.killOnStop
	});

	workforce.api.on('dead', function(){
		self.log('Workforce dead');
		delete self.workforceEmitters[workforceId];
	});

	this.workforceEmitters[workforceId] = workforceEmitter;

	workerConfig.populate = false; // population is done on this side of the connection
	workerConfig.killOnStop = false; // killing is controlled on this side
	this.sendToSocket({
		type: 'spawnWorkforce', 
		id: workforceId,
		config: workerConfig
	});

	if(populate !== false){
		workerProviders = this.getWorkerProviders();

		if(populate === void 0
		   || workerConfig.populate === "once"){
			workforce.populate(workerProviders);
		} else if(populate === "continuous"){
			this.continuousWorkforces[workforceId] = workforce;			
			workforce.api.on('dead', function(){
				delete self.continuousWorkforces[workforceId];
			});

			workforce.populate(workerProviders);
		}
	}

	this.log('New workforce');
	this.emitter.emit('workforce', workforce.api);

	return workforce.api;
};