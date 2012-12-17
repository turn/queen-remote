var sinon = require('sinon'),
	mocks = require('mocks'),
	path = require('path'),
	mock = require('../mocks.js'),
	testedModule = mocks.loadFile(path.resolve(path.dirname(module.filename), '../../lib/client/workerProvider.js'));

var WorkerProvider = testedModule.WorkerProvider;
var create = testedModule.create;
var MESSAGE_TYPE = testedModule.MESSAGE_TYPE;

exports.workerProvider = {
	setUp: function(callback){
		this.TEST_STRING = "Hello, world!";
		this.TEST_OBJECT = {message: this.TEST_STRING};
		this.emitter = mock.emitter();
		this.workerProvider = new WorkerProvider(1, this.emitter, this.TEST_OBJECT);
		callback();
	},
	create: function(test){
		var wp;

		test.throws(function(){wp = create()}, "Able to construct with missing required params");
		
		wp = create(1, this.emitter, this.TEST_OBJECT);
		test.ok(wp !== void 0, "Unable to construct with valid params");

		test.done();
	},
	construct: function(test){
		var wp;
		test.throws(function(){wp = new WorkerProvider()}, "Able to construct with missing required params");
		
		wp = new WorkerProvider(1, this.emitter, this.TEST_OBJECT);
		test.ok(wp instanceof WorkerProvider, "Unable to construct with valid params");

		test.done();
	},
	messageHandlerAvailable: function(test){
		var spy = sinon.spy(this.workerProvider, "setAvailable");
		this.emitter.emit("message", [MESSAGE_TYPE['available']]);
		test.ok(spy.calledOnce);
		test.done();
	},
	messageHandlerUnavailable: function(test){
		var spy = sinon.spy(this.workerProvider, "setUnavailable");
		this.emitter.emit("message", [MESSAGE_TYPE['unavailable']]);
		test.ok(spy.calledOnce);
		test.done();
	},
	messageHandlerWorkerSpawned: function(test){
		var spy = sinon.spy(this.workerProvider, "workerSpawned");
		this.emitter.emit("message", [MESSAGE_TYPE['worker spawned'], 1]);
		test.ok(spy.calledWith(1));
		test.done();
	},
	messageHandlerWorkerDead: function(test){
		var spy = sinon.spy(this.workerProvider, "workerDead");
		this.emitter.emit("message", [MESSAGE_TYPE['worker dead'], 1]);
		test.ok(spy.calledWith(1));
		test.done();
	}
}