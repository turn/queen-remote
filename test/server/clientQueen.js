var sinon = require('sinon'),
	mocks = require('mocks'),
	path = require('path'),
	EventEmitter = require('events').EventEmitter,
	testedModule = mocks.loadFile(path.resolve(path.dirname(module.filename), '../../lib/server/clientQueen.js'));

var ClientQueen = testedModule.ClientQueen;
var create = testedModule.create;
var MESSAGE_TYPE = testedModule.MESSAGE_TYPE;

var createMockQueen = function(){
	var mock = sinon.spy();
	
	var eventEmitter = mock.emitter = new EventEmitter();
	mock.on = sinon.spy(eventEmitter.on.bind(eventEmitter));
	mock.removeListener = sinon.spy(eventEmitter.removeListener.bind(eventEmitter));
	mock.kill = sinon.spy(function(){eventEmitter.emit('dead')});
	mock.workerProviders = [];

	return mock;
};

var createMockSocket = function(){
	var socket = {};
	var eventEmitter = socket.emitter = new EventEmitter();
	socket.on = eventEmitter.on.bind(eventEmitter);
	socket.removeListener = eventEmitter.removeListener.bind(eventEmitter);
	socket.write = sinon.spy();

	return socket;
};

exports.clientQueen = {
	setUp: function(callback){
		this.TEST_STRING = "Hello, world!";
		this.TEST_OBJECT = {message: this.TEST_STRING};
		this.socket = createMockSocket();
		this.queen = createMockQueen();
		this.clientQueen = new ClientQueen(this.socket, this.queen);
		callback();
	},
	create: function(test){
		var clientQueen;

		test.throws(function(){clientQueen = create()}, "Able to construct with missing required params");
		
		clientQueen = create(this.socket, this.queen);
		test.ok(clientQueen !== void 0, "Unable to construct with valid params");

		test.done();
	},
	construct: function(test){
		var clientQueen;
		test.throws(function(){clientQueen = new Queen()}, "Able to construct with missing required params");
		
		clientQueen = new ClientQueen(this.socket, this.queen);
		test.ok(clientQueen instanceof ClientQueen, "Unable to construct with valid params");

		test.done();
	},
	readySignal: function(test){
		this.socket.write.calledWith([MESSAGE_TYPE['ready']]);
		test.done();
	},
	sendToSocket: function(test){
		this.clientQueen.sendToSocket(this.TEST_OBJECT);
		test.ok(this.socket.write.calledWith(this.TEST_OBJECT));
		test.done();
	},
	workforceMessageMessageHandler: function(test){
		var spy = sinon.spy(this.clientQueen, "workforceMessage");

		this.socket.emitter.emit('data', [
			MESSAGE_TYPE['workforce message'],
			1,
			1
		]);

		test.strictEqual(spy.callCount, 1);
		test.done();
	},
	createWorkforceMessageHandler: function(test){
		var spy = sinon.spy(this.clientQueen, "createWorkforce");

		this.socket.emitter.emit('data', [
			MESSAGE_TYPE['create workforce'],
			1,
			{}
		]);

		test.strictEqual(spy.callCount, 1);
		test.done();
	},
	trackWorkerProviderMessageHandler: function(test){
		this.clientQueen.trackWorkerProviders = false;

		this.socket.emitter.emit('data', [
			MESSAGE_TYPE['track worker provider'],
			true
		]);

		test.strictEqual(this.clientQueen.trackWorkerProviders, true);
		test.done();
	},
	createWorkforce: function(test){
		test.strictEqual(this.clientQueen.workforces["1"], void 0);
		this.clientQueen.createWorkforce(1, {});
		test.notStrictEqual(this.clientQueen.workforces["1"], void 0);	
		
		test.done();
	},
	workforceMessage: function(test){
		this.clientQueen.createWorkforce(1, {});
		var spy = sinon.spy(this.clientQueen.workforces, "1");
		this.clientQueen.workforceMessage(1, this.TEST_OBJECT);

		test.ok(spy.calledWith(this.TEST_OBJECT));

		test.done();
	},
	workforceOnSendToSocket: function(test){
		// TODO
		test.done();
	},
	workforceDeath: function(test){
		// TODO
		test.done();
	},
	workerProviderHandler: function(test){
		// TODO
		test.done();
	},
	workerProviderHandlerOnSendToSocket: function(test){
		// TODO
		test.done();
	},
	workerProviderDeath: function(test){
		// TODO
		test.done();
	},
	kill: function(test){
		this.clientQueen.kill();
		test.ok(this.queen.removeListener.calledWith('workerProvider'));
		test.done();
	},
	socketClose: function(test){
		this.socket.emitter.emit('close');
		test.ok(this.queen.removeListener.calledWith('workerProvider'));
		test.done();
	},
	socketEnd: function(test){
		this.socket.emitter.emit('end');
		test.ok(this.queen.removeListener.calledWith('workerProvider'));
		test.done();
	},
	socketError: function(test){
		this.socket.emitter.emit('error');
		test.ok(this.queen.removeListener.calledWith('workerProvider'));
		test.done();
	}
}