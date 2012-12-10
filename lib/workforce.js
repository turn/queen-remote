var EventEmitter = require('events').EventEmitter,
	_ = require('underscore'),
	precondition = require('precondition'),
	createWorker = require('./worker.js').create;

var utils = require('./utils.js');

exports.create = function(getWorkerProvider, socket, onSendToSocket, options){
	var workforce = new Workforce(getWorkerProvider, socket, onSendToSocket);

	if(options.stopHandler){
		workforce.stopHandler = options.stopHandler;
		workforce.killOnStop = false;
	} 
	if(options.workerHandler) workforce.workerHandler = options.workerHandler;
	if(options.providerFilter) workforce.providerFilter = options.providerFilter;
	if(options.killOnStop !== void 0) workforce.killOnStop = options.killOnStop;

	return workforce;
};

var Workforce = exports.Workforce = function(getWorkerProvider, socket, onSendToSocket){
	this.socket = socket;
	this.getWorkerProvider = getWorkerProvider;
	this.sendToSocket = onSendToSocket;
	this.emitter = new EventEmitter();
	this.workerEmitters = {};
	
	this.kill = _.once(this.kill.bind(this));

	socket.on('message', this.messageHandler.bind(this));

	this.api = Object.freeze(getApi.call(this));
};

Workforce.prototype.workerHandler = utils.noop;
Workforce.prototype.stopHandler = utils.noop;
Workforce.prototype.providerFilter = function(){return true;};
Workforce.prototype.killOnStop = true;

var getApi = function(){
	var api = this.broadcast.bind(this);
	api.on = this.emitter.on.bind(this.emitter);
	api.removeListener = this.emitter.removeListener.bind(this.emitter);
	api.kill = this.kill;
	api.populate = this.populate.bind(this);
	
	return api;
};

Workforce.prototype.messageHandler = function(message){
	switch(message.type){
		case "workerMessage":
			this.workerMessageHandler(message);
			return;
		case "addWorker":
			this.addWorkerHandler(message);
			return;
		case "stop":
			this.stop();
			return;
	}
};

Workforce.prototype.stop = function(){
	this.stopHandler();
	if(this.killOnStop){
		this.kill();
	}
};

Workforce.prototype.kill = function(){
	this.sendToSocket({type:"kill"});

	_.each(this.workerEmitters, function(workerEmitter){
		workerEmitter.emit('dead');
	});
	
	this.emitter.emit('dead');
	this.emitter.removeAllListeners();
};

Workforce.prototype.broadcast = function(message){
	this.sendToSocket({
		type: "broadcast",
		message: message
	});
};


Workforce.prototype.populate = function(workerProviders){
	var self = this;

	if(!_.isArray(workerProviders)) workerProviders = [workerProviders];

	var providerIds = workerProviders
						.filter(this.providerFilter)
						.map(function(provider){ return provider.id });
	
	if(providerIds.length === 0) return;

	this.sendToSocket({
		type: "populate",
		providerIds: providerIds 
	});
};

Workforce.prototype.addWorkerHandler = function(message){
	var self = this,
		workerId = message.id,
		workerProvider = this.getWorkerProvider(message.providerId),
		workerEmitter = new EventEmitter(),
		worker,
		onEmitToSocket;

	console.log("Worker: " + workerId + " " + workerProvider.attributes.name);
	
	onSendToSocket = function(message){
		self.sendToSocket({
			type: 'workerMessage',
			id: workerId,
			message: message
		});
	};

	worker = createWorker(workerId, workerProvider, workerEmitter, onSendToSocket);

	this.workerEmitters[workerId] = workerEmitter;
	worker.on('dead', function(){
		var workerEmitter = self.workerEmitters[workerId];
		if(workerEmitter !== void 0){
			delete self.workerEmitters[workerId];
		}
	});

	worker.on('message', function(message){
		self.emitter.emit('message', message, worker);
	});

	this.workerHandler(worker);
};

Workforce.prototype.workerMessageHandler = function(message){
	var workerEmitter = this.workerEmitters[message.id];
	if(workerEmitter !== void 0){
		workerEmitter.emit('message', message.message);
	}
}
