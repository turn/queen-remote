var sinon = require('sinon'),
	mocks = require('mocks'),
	path = require('path'),
	mock = require('../mocks.js'),
	testedModule = mocks.loadFile(path.resolve(path.dirname(module.filename), '../../lib/server/clientQueen.js'));

var ClientQueen = testedModule.ClientQueen;
var create = testedModule.create;
var MESSAGE_TYPE = testedModule.MESSAGE_TYPE;

exports.clientQueen = {
	setUp: function(callback){
		this.TEST_STRING = "Hello, world!";
		this.TEST_OBJECT = {message: this.TEST_STRING};
		this.socket = mock.socket();
		this.queen = mock.queen();
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
	workforceDeath: function(test){
		this.clientQueen.createWorkforce(1, {});
		this.clientQueen.workforces["1"].kill();

		test.ok(this.clientQueen.workforces["1"] === void 0);
		test.done();
	},
	workerProviderHandler: function(test){
		var mockWP = mock.workerProvider();
		this.clientQueen.workerProviderHandler(mockWP);
		test.ok(this.socket.write.calledWith([
			MESSAGE_TYPE['create worker provider'],
			mockWP.id,
			mockWP.attributes
		]));
		test.done();
	},
	workerProviderDeath: function(test){
		var mockWP = mock.workerProvider();
		this.clientQueen.workerProviderHandler(mockWP);
		mockWP.kill();

		test.ok(this.clientQueen.workerProviders[mockWP.id] === void 0);
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