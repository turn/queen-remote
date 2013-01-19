var EventEmitter = require("events").EventEmitter,
	net = require('net'),
	its = require('its'),
	MESSAGE_TYPE = require('../protocol.js').WORKFORCE_MESSAGE_TYPE;

var utils = require('../utils.js');

var create = module.exports = function(queen, workerConfig, onSendToSocket){
	var workforce = new ClientWorkforce(queen, workerConfig, onSendToSocket);

	return workforce.api;
};

var getApi = function(workforce){
	var api = workforce.messageHandler.bind(workforce);
	api.on = workforce.emitter.on.bind(workforce.emitter);
	api.removeListener = workforce.emitter.removeListener.bind(workforce.emitter);
	api.kill = workforce.kill;

	return api;
};

var ClientWorkforce = function(queen, workerConfig, onSendToSocket){
	its.object(queen, "ControlServerWorkforce requires a queen");
	its.object(workerConfig, "ControlServerWorkforce requires a worker config");
	its.func(onSendToSocket, "ControlServerWorkforce requires an on send to socket function");

	this.sendToSocket = onSendToSocket;

	workerConfig.handler = this.workerHandler.bind(this);
	workerConfig.stop = this.stopHandler.bind(this);
	this.workers = {};
	this.emitter = new EventEmitter();
	this.queen = queen;
	this.workforce = queen(workerConfig);

	this.kill = utils.once(this.kill.bind(this));
	this.api = Object.freeze(getApi(this));
};

ClientWorkforce.prototype.stopHandler = function(){
	this.sendToSocket([MESSAGE_TYPE['stop']]);
};

ClientWorkforce.prototype.workerHandler = function(worker){
	var self = this;
	this.workers[worker.id] = worker;

	self.sendToSocket([
		MESSAGE_TYPE['add worker'],
		worker.id,
		worker.provider.id
	]);

	worker.on('message', function(message){
		self.sendToSocket([
			MESSAGE_TYPE['worker message'],
			worker.id,
			message
		]);
	});

	worker.on('dead', function(reason){
		self.sendToSocket([
			MESSAGE_TYPE['worker dead'],
			worker.id,
			reason
		]);
	});
};

ClientWorkforce.prototype.kill = function(){
	this.sendToSocket = utils.noop;
	this.workforce.kill();
	this.emitter.emit('dead');
	this.emitter.removeAllListeners();	
};

ClientWorkforce.prototype.workerMessageHandler = function(workerId, workerMessage){
	var worker = this.workers[workerId];

	if(worker !== void 0){
		worker(workerMessage);
	}
};

ClientWorkforce.prototype.workerDeadHandler = function(workerId, reason){
	var worker = this.workers[workerId];

	if(worker !== void 0){
		worker.kill(reason);
	}
};

ClientWorkforce.prototype.populateHandler = function(providerIds){
	var self = this,
		providers = providerIds.map(function(id){
			return self.queen.getWorkerProvider(id);
		}).filter(function(provider){
			return provider !== void 0;
		});

	this.workforce.populate(providers);
};

ClientWorkforce.prototype.messageHandler = function(message){
	switch(message[0]){
		case MESSAGE_TYPE['worker message']:
			this.workerMessageHandler(message[1], message[2]);
			break;
		case MESSAGE_TYPE['worker dead']:
			this.workerDeadHandler(message[1], message[2]);
			break;
		case MESSAGE_TYPE['broadcast']:
			this.workforce(message[1]);
			break;
		case MESSAGE_TYPE['kill']:
			this.kill();
			break;
		case MESSAGE_TYPE['populate']:
			this.populateHandler(message[1]);
			break;
	}
};
