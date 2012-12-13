var MESSAGE_TYPE = require('../protocol.js').WORKER_PROVIDER_MESSAGE_TYPE;

exports.create = function(id, emitter, attributes){
	var workerProvider = new WorkerProvider(id, emitter, attributes);

	return Object.freeze(getApi.call(workerProvider));
};

var getApi = function(){
	var api = {};
	api.on = this.emitter.on.bind(this.emitter);
	api.removeListener = this.emitter.removeListener.bind(this.emitter);
	api.attributes = this.attributes;
	api.id = this.id;

	return api;
};

var WorkerProvider = exports.WorkerProvider = function(id, emitter, attributes){
	this.id = id;
	this.emitter = emitter;
	this.attributes = Object.freeze(attributes);
	this.emitter.on('message', this.messageHandler.bind(this));
};

WorkerProvider.prototype.unavailableHandler = function(){
	this.available = false;
	this.emitter.emit('unavailable');
};

WorkerProvider.prototype.availableHandler = function(){
	this.available = true;
	this.emitter.emit('available');
};

WorkerProvider.prototype.workerHandler = function(workerId){
	this.emitter.emit('worker', {
		id: workerId
	});
};

WorkerProvider.prototype.workerDeadHandler = function(workerId){
	this.emitter.emit('workerDead', workerId);
};

WorkerProvider.prototype.messageHandler = function(message){
	switch(message[0]){
		case MESSAGE_TYPE["available"]:
			this.availableHandler();
			break;
		case MESSAGE_TYPE["unavailable"]:
			this.unavailableHandler();
			break;
		case MESSAGE_TYPE["worker spawned"]:
			this.workerHandler(message[1]);
			break;
		case MESSAGE_TYPE["worker dead"]:
			this.workerDeadHandler(message[1]);
			break;
	}
};