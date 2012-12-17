var sinon = require('sinon'),
	mocks = require('mocks'),
	path = require('path'),
	mock = require('../mocks.js');
	

var testedModule = mocks.loadFile(path.resolve(path.dirname(module.filename), '../../lib/client/worker.js'));
var Worker = testedModule.Worker;
var create = testedModule.create;
var MESSAGE_TYPE = testedModule.MESSAGE_TYPE;

exports.worker = {
	setUp: function(callback){
		this.TEST_STRING = "Hello, world!";
		this.TEST_OBJECT = {
			message: this.TEST_STRING
		};
		
		this.provider = mock.workerProvider();
		this.emitter = mock.emitter();
		this.onSendToSocket = sinon.spy();
		this.worker = new Worker(1, this.provider, this.emitter, this.onSendToSocket);
		callback();
	},
	create: function(test){
		var worker;
		
		var worker = create(this.id, this.provider, this.emitter, this.onSendToSocket);
		test.ok(worker);

		test.done();
	},
	kill: function(test){
		var spy = sinon.spy();
		this.worker.api.on('dead', spy);
		this.worker.kill();
		test.ok(spy.calledOnce);
		test.done();
	}
};