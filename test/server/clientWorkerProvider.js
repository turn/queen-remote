var sinon = require('sinon'),
	mocks = require('mocks'),
	path = require('path'),
	mock = require('../mocks.js'),
	testedModule = mocks.loadFile(path.resolve(path.dirname(module.filename), '../../lib/server/clientWorkerProvider.js'));

var ClientWorkerProvider = testedModule.ClientWorkerProvider;
var create = testedModule.create;
var MESSAGE_TYPE = testedModule.MESSAGE_TYPE;

exports.clientWorkerProvider = {
	setUp: function(callback){
		this.TEST_STRING = "Hello, world!";
		this.TEST_OBJECT = {message: this.TEST_STRING};
		this.onSendToSocket = sinon.spy();
		this.workerProvider = mock.workerProvider();
		this.clientWorkerProvider = new ClientWorkerProvider(this.workerProvider, this.onSendToSocket);
		callback();
	},
	create: function(test){
		var cwp;

		test.throws(function(){cwp = create()}, "Able to construct with missing required params");
		
		cwp = create(this.workerProvider, this.onSendToSocket);
		test.ok(cwp !== void 0, "Unable to construct with valid params");

		test.done();
	},
	construct: function(test){
		var cwp;
		test.throws(function(){cwp = new ClientWorkerProvider()}, "Able to construct with missing required params");
		
		cwp = new ClientWorkerProvider(this.workerProvider, this.onSendToSocket);
		test.ok(cwp instanceof ClientWorkerProvider, "Unable to construct with valid params");

		test.done();
	},
	onWPDead: function(test){
		var spy = sinon.spy();
		this.clientWorkerProvider.emitter.on('dead', spy);
		
		this.workerProvider.kill();
		
		test.strictEqual(spy.callCount, 1);
		test.done();
	},
	onWPAvailable: function(test){
		this.workerProvider.emitter.emit('available');
		test.ok(this.onSendToSocket.calledWith([MESSAGE_TYPE['available']]));
		test.done();
	},
	onWPUnavailable: function(test){
		this.workerProvider.emitter.emit('unavailable');
		test.ok(this.onSendToSocket.calledWith([MESSAGE_TYPE['unavailable']]));
		test.done();
	},
	onWPWorker: function(test){
		this.workerProvider.emitter.emit('worker', {id: 1});
		test.ok(this.onSendToSocket.calledWith([MESSAGE_TYPE['worker spawned'], 1]));
		test.done();
	},
	onWPWorkerDead: function(test){
		this.workerProvider.emitter.emit('workerDead', 1);
		test.ok(this.onSendToSocket.calledWith([MESSAGE_TYPE['worker dead'], 1]));
		test.done();
	}
}