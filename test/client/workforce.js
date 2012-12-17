var sinon = require('sinon'),
	mocks = require('mocks'),
	path = require('path'),
	mock = require('../mocks.js'),
	testedModule = mocks.loadFile(path.resolve(path.dirname(module.filename), '../../lib/client/workforce.js'));

var Workforce = testedModule.Workforce;
var create = testedModule.create;
var MESSAGE_TYPE = testedModule.MESSAGE_TYPE;

exports.workforce = {
	setUp: function(callback){
		this.TEST_STRING = "Hello, world!";
		this.TEST_OBJECT = {message: this.TEST_STRING};
		this.workerProvider = mock.workerProvider();
		this.getWorkerProvider = sinon.stub().returns(this.workerProvider);
		this.socket = mock.emitter();
		this.onSendToSocket = sinon.spy();
		this.workforce = new Workforce(this.getWorkerProvider, this.socket, this.onSendToSocket, {});
		callback();
	},
	create: function(test){
		var wf;

		test.throws(function(){wf = create()}, "Able to construct with missing required params");
		
		wf = create(this.getWorkerProvider, this.socket, this.onSendToSocket, {});
		test.ok(wf !== void 0, "Unable to construct with valid params");

		test.done();
	},
	construct: function(test){
		var wf;
		test.throws(function(){wf = new Workforce()}, "Able to construct with missing required params");
		
		wf = new Workforce(this.getWorkerProvider, this.socket, this.onSendToSocket, {});
		test.ok(wf instanceof Workforce, "Unable to construct with valid params");

		test.done();
	},
	messageHandlerWorkerMessage: function(test){
		var spy = sinon.spy(this.workforce, "workerMessage");
		this.socket.emit("message", [MESSAGE_TYPE['worker message'], 1, this.TEST_OBJECT]);
		test.ok(spy.calledOnce);
		test.done();
	},
	messageHandlerAddWorker: function(test){
		var spy = sinon.spy(this.workforce, "addWorker");
		this.socket.emit("message", [MESSAGE_TYPE['add worker'], 1, this.workerProvider.id]);
		test.ok(spy.calledOnce);
		test.done();
	},
	messageHandlerStop: function(test){
		var spy = sinon.spy(this.workforce, "stop");
		this.socket.emit("message", [MESSAGE_TYPE['stop']]);
		test.ok(spy.called);
		test.done();
	},
	broadcast: function(test){
		this.workforce.broadcast(this.TEST_OBJECT);

		test.equal(this.onSendToSocket.firstCall.args[0][1], this.TEST_OBJECT);
		test.done();
	},
	kill: function(test){
		var spy = sinon.spy();

		this.workforce.api.on('dead', spy);

		this.workforce.kill();

		test.ok(spy.calledOnce);
		test.done();
	},
	populate: function(test){
		this.workforce.populate(this.workerProvider);
		test.strictEqual(this.onSendToSocket.lastCall.args[0][1][0], this.workerProvider.id);
		test.done();
	},
	addWorker: function(test){
		var spy = sinon.spy(this.workforce, "workerHandler");

		this.workforce.addWorker(1, 1);

		test.strictEqual(spy.lastCall.args[0].id, 1);
		test.done();

	}
}