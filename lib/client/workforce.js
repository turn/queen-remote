var EventEmitter = require('events').EventEmitter,
	precondition = require('precondition'),
	createWorker = require('./worker.js').create;

var utils = require('../utils.js'),
	MESSAGE_TYPE = require('../protocol.js').WORKFORCE_MESSAGE_TYPE;

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
	
	this.kill = utils.once(this.kill.bind(this));

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
	switch(message[0]){
		case MESSAGE_TYPE["worker message"]:
			this.workerMessageHandler(message[1], message[2]);
			return;
		case MESSAGE_TYPE["add worker"]:
			this.addWorkerHandler(message[1], message[2]);
			return;
		case MESSAGE_TYPE["stop"]:
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
	this.sendToSocket([MESSAGE_TYPE['kill']]);

	Object.keys(this.workerEmitters).forEach(function(workerEmitterId){

	});

	utils.each(this.workerEmitters, function(workerEmitter){
		workerEmitter.emit('dead');
	});
	
	this.emitter.emit('dead');
	this.emitter.removeAllListeners();
};

Workforce.prototype.broadcast = function(message){
	this.sendToSocket([
		MESSAGE_TYPE['broadcast'],
		message
	]);
};

Workforce.prototype.populate = function(workerProviders){
	var self = this;

	if(!Array.isArray(workerProviders)) workerProviders = [workerProviders];

	var providerIds = workerProviders
						.filter(this.providerFilter)
						.map(function(provider){ return provider.id });
	
	if(providerIds.length === 0) return;

	this.sendToSocket([
		MESSAGE_TYPE['populate'],
		providerIds
	]);
};

Workforce.prototype.addWorkerHandler = function(workerId, providerId){
	var self = this,
		workerId = workerId,
		workerProvider = this.getWorkerProvider(providerId),
		workerEmitter = new EventEmitter(),
		worker,
		onEmitToSocket;

	console.log("Worker: " + workerId + " " + workerProvider.attributes.name);
	
	onSendToSocket = function(message){
		self.sendToSocket([
			MESSAGE_TYPE['worker message'],
			workerId,
			message
		]);
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

Workforce.prototype.workerMessageHandler = function(workerId, workerMessage){
	var workerEmitter = this.workerEmitters[workerId];

	if(workerEmitter === void 0) return;
	
	workerEmitter.emit('message', workerMessage);
}
