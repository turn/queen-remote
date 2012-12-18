var sinon = require('sinon'),
	EventEmitter = require('events').EventEmitter;

exports.workforce = function(){
	var mock = sinon.spy();
	var eventEmitter = mock.emitter = new EventEmitter();
	mock.on = eventEmitter.on.bind(eventEmitter);
	mock.removeListener = eventEmitter.removeListener.bind(eventEmitter);
	mock.kill = sinon.spy(function(){eventEmitter.emit('dead')});
	mock.populate = sinon.spy();
	return mock;
};

exports.queen = function(){
	var mock = sinon.stub().returns(1);
	mock.workforce = exports.workforce();
	mock.returns(mock.workforce);
	mock.workerProvider = exports.workerProvider();
	var eventEmitter = mock.emitter = new EventEmitter();
	mock.on = sinon.spy(eventEmitter.on.bind(eventEmitter));
	mock.removeListener = sinon.spy(eventEmitter.removeListener.bind(eventEmitter));
	mock.kill = sinon.spy(function(){eventEmitter.emit('dead')});
	mock.workerProviders = [];
	mock.getWorkerProvider = sinon.stub().returns(mock.workerProvider);
	return mock;
};

exports.socket = function(){
	var socket = {};
	var eventEmitter = socket.emitter = new EventEmitter();
	socket.on = eventEmitter.on.bind(eventEmitter);
	socket.removeListener = eventEmitter.removeListener.bind(eventEmitter);
	socket.write = sinon.spy();
	socket.connect = sinon.spy();
	socket.end = sinon.spy();
	return socket;
};

exports.emitter = function(){
	var eventEmitter = new EventEmitter();
	mock = {};
	mock.on = sinon.spy(eventEmitter, "on");
	mock.removeListener = sinon.spy(eventEmitter, "removeListener");
	mock.emit = sinon.spy(eventEmitter, "emit");
	mock.removeAllListeners = sinon.spy(eventEmitter, "removeAllListeners");	
	return mock;
};

exports.workerProvider = function(){
	var mock = {};

	var eventEmitter = mock.emitter = new EventEmitter();
	mock.on = eventEmitter.on.bind(eventEmitter);
	mock.removeListener = eventEmitter.removeListener.bind(eventEmitter);
	mock.kill = sinon.spy(function(){eventEmitter.emit('dead')});
	mock.id = 1;
	mock.attributes = {};
	return mock;
};

exports.worker = function(){
	var mock = sinon.spy();
	var eventEmitter = mock.emitter = new EventEmitter();
	mock.on = eventEmitter.on.bind(eventEmitter);
	mock.removeListener = eventEmitter.removeListener.bind(eventEmitter);
	mock.kill = sinon.spy(function(){eventEmitter.emit('dead')});
	mock.id = 1;
	mock.provider = exports.workerProvider();
	return mock;
};