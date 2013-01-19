var MESSAGE_TYPE = require('../protocol.js').WORKER_PROVIDER_MESSAGE_TYPE,
	its = require('its');

var create = exports.create = function(id, emitter, attributes){
	var workerProvider = new WorkerProvider(id, emitter, attributes);

	return Object.freeze(getApi.call(workerProvider));
};

var getApi = function(){
	var api = {};
	api.on = this.emitter.on.bind(this.emitter);
	api.removeListener = this.emitter.removeListener.bind(this.emitter);
	api.attributes = this.attributes;
	api.id = this.id;
	api.toString = this.toString.bind(this);
	return api;
};

var WorkerProvider = exports.WorkerProvider = function(id, emitter, attributes){
	its.defined(id, "Id required");
	its.object(emitter, "Emitter required");
	its.object(attributes, "Attributes required");
	
	this.id = id;
	this.emitter = emitter;
	this.attributes = Object.freeze(attributes);
	this.emitter.on('message', this.messageHandler.bind(this));
};

WorkerProvider.prototype.toString = function(){
	return this.attributes && this.attributes.name || "Browser Worker Provider";
};

WorkerProvider.prototype.setUnavailable = function(){
	this.available = false;
	this.emitter.emit('unavailable');
};

WorkerProvider.prototype.setAvailable = function(){
	this.available = true;
	this.emitter.emit('available');
};

WorkerProvider.prototype.workerSpawned = function(workerId){
	this.emitter.emit('worker', {
		id: workerId
	});
};

WorkerProvider.prototype.workerDead = function(workerId){
	this.emitter.emit('workerDead', workerId);
};

WorkerProvider.prototype.messageHandler = function(message){
	switch(message[0]){
		case MESSAGE_TYPE["available"]:
			this.setAvailable();
			break;
		case MESSAGE_TYPE["unavailable"]:
			this.setUnavailable();
			break;
		case MESSAGE_TYPE["worker spawned"]:
			this.workerSpawned(message[1]);
			break;
		case MESSAGE_TYPE["worker dead"]:
			this.workerDead(message[1]);
			break;
	}
};