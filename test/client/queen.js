var sinon = require('sinon'),
	mocks = require('mocks'),
	path = require('path'),
	mock = require('../mocks.js');
	

var testedModule = mocks.loadFile(path.resolve(path.dirname(module.filename), '../../lib/client/queen.js'));
var Queen = testedModule.Queen;
var create = testedModule.create;
var MESSAGE_TYPE = testedModule.MESSAGE_TYPE;

exports.queen = {
	setUp: function(callback){
		this.TEST_STRING = "Hello, world!";
		this.TEST_OBJECT = {
			message: this.TEST_STRING
		};

		this.callback = sinon.spy();
		this.socket = mock.socket();
		this.queen = new Queen(this.socket);
		this.queen.onReady = this.callback;
		this.api = testedModule.getApi(this.queen);
		callback();
	},
	create: function(test){
		var queen;
		
		create(this.callback, {socket:this.socket});
		
		test.done();
	},
	construct: function(test){
		var queen;
		test.throws(function(){queen = new Queen()}, "Able to construct with missing required params");
		
		queen = new Queen(this.socket);
		test.ok(queen instanceof Queen, "Unable to construct with valid params");

		test.done();
	},
	messageHandlerWorkforceMessage: function(test){
		var spy = sinon.spy(this.queen, "workforceMessage");

		this.socket.emitter.emit('data', [
			MESSAGE_TYPE['workforce message'],
			1,
			1
		]);

		test.strictEqual(spy.callCount, 1);
		test.done();
	},
	messageHandlerWorkerProviderMessage: function(test){
		var spy = sinon.spy(this.queen, "workerProviderMessage");

		this.socket.emitter.emit('data', [
			MESSAGE_TYPE['worker provider message'],
			1,
			1
		]);

		test.strictEqual(spy.callCount, 1);
		test.done();
	},
	messageHandlerCreateWorkerProvider: function(test){
		var spy = sinon.spy(this.queen, "createWorkerProvider");

		this.socket.emitter.emit('data', [
			MESSAGE_TYPE['create worker provider'],
			1,
			this.TEST_OBJECT
		]);

		test.strictEqual(spy.callCount, 1);
		test.done();
	},
	messageHandlerReady: function(test){
		this.socket.emitter.emit('data', [
			MESSAGE_TYPE['ready']
		]);

		test.strictEqual(this.callback.callCount, 1);
		test.done();
	},
	kill: function(test){
		var spy = sinon.spy();
		this.api.on('dead', spy);
		this.queen.kill();
		test.ok(spy.calledOnce);
		test.done();
	},
	createWorkerProvider: function(test){
		var spy = sinon.spy();
		this.api.on('workerProvider', spy);
		this.queen.createWorkerProvider(1, this.TEST_OBJECT);
		test.ok(spy.firstCall.args[0].id === 1);
		test.done();
	},
	getWorkforce: function(test){
		var spy = sinon.spy();
		this.api.on('workforce', spy);
		this.queen.getWorkforce(this.TEST_OBJECT);
		test.ok(spy.calledOnce);
		test.done();
	}
	/** 
		TODO: add additional test to test the various options of workforce and 
		worker provider creation
	*/
};