var utils = require('../utils.js'),
	EventEmitter = require("events").EventEmitter,
	MESSAGE_TYPE = require('../protocol.js').WORKER_PROVIDER_MESSAGE_TYPE,
	its = require('its');

var create = module.exports = function(workerProvider, onSendToSocket){
	var workerProvider = new ClientWorkerProvider(workerProvider, onSendToSocket);

	return getApi.call(workerProvider);
};

var getApi = function(){
	var api = {};
	api.on = this.emitter.on.bind(this.emitter);
	api.removeListener = this.emitter.removeListener.bind(this.emitter);
	api.kill = this.kill;
	return api;
};

var ClientWorkerProvider = function(workerProvider, onSendToSocket){
	its.object(workerProvider, "WorkerProviders requires a concrete queen worker provider");
	its.function(onSendToSocket, "WorkerProviders requires a onSendToSocket function");

	this.workerProvider = workerProvider;
	this.sendToSocket = onSendToSocket;

	this.emitter = new EventEmitter();

	this.kill = utils.once(this.kill.bind(this));
	this.availableHandler = this.availableHandler.bind(this);
	this.unavailableHandler = this.unavailableHandler.bind(this);
	this.workerHandler = this.workerHandler.bind(this);
	this.workerDeadHandler = this.workerDeadHandler.bind(this);

	workerProvider.on('dead', this.kill);
	workerProvider.on('available', this.availableHandler);
	workerProvider.on('unavailable', this.unavailableHandler);
	workerProvider.on('worker', this.workerHandler);
	workerProvider.on('workerDead', this.workerDeadHandler);
};

ClientWorkerProvider.prototype.kill = function(){
	this.workerProvider.removeListener('dead', this.kill);
	this.workerProvider.removeListener('available', this.availableHandler);
	this.workerProvider.removeListener('unavailable', this.unavailableHandler);
	this.workerProvider.removeListener('worker', this.workerHandler);
	this.workerProvider.removeListener('workerDead', this.workerDeadHandler);
	this.emitter.emit('dead');
	this.emitter.removeAllListeners();
};

ClientWorkerProvider.prototype.workerHandler = function(worker){
	this.sendToSocket([
		MESSAGE_TYPE['worker spawned'],
		worker.id
	]);
};

ClientWorkerProvider.prototype.workerDeadHandler = function(workerId){
	this.sendToSocket([
		MESSAGE_TYPE['worker dead'],
		workerId
	]);
};

ClientWorkerProvider.prototype.unavailableHandler = function(){
	this.sendToSocket([MESSAGE_TYPE['unavailable']]);
};

ClientWorkerProvider.prototype.availableHandler = function(){
	this.sendToSocket([MESSAGE_TYPE['available']]);
};