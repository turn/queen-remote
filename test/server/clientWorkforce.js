var sinon = require('sinon'),
	mocks = require('mocks'),
	path = require('path'),
	mock = require('../mocks.js'),
	testedModule = mocks.loadFile(path.resolve(path.dirname(module.filename), '../../lib/server/clientWorkforce.js'));

var ClientWorkforce = testedModule.ClientWorkforce;
var create = testedModule.create;
var MESSAGE_TYPE = testedModule.MESSAGE_TYPE;

exports.clientWorkforce = {
	setUp: function(callback){
		this.TEST_STRING = "Hello, world!";
		this.TEST_OBJECT = {message: this.TEST_STRING};
		this.onSendToSocket = sinon.spy();
		this.workerConfig = {};
		this.queen = mock.queen();
		this.clientWorkforce = new ClientWorkforce(this.queen, this.workerConfig, this.onSendToSocket);
		callback();
	},
	create: function(test){
		var cwf;

		test.throws(function(){cwf = create()}, "Able to construct with missing required params");
		
		cwf = create(this.queen, this.workerConfig, this.onSendToSocket);
		test.ok(cwf !== void 0, "Unable to construct with valid params");

		test.done();
	},
	construct: function(test){
		var cwf;
		test.throws(function(){cwf = new ClientWorkforce()}, "Able to construct with missing required params");
		
		cwf = new ClientWorkforce(this.queen, this.workerConfig, this.onSendToSocket);
		test.ok(cwf instanceof ClientWorkforce, "Unable to construct with valid params");

		test.done();
	},
	messageHandlerWorkerMessage: function(test){
		var spy = sinon.spy(this.clientWorkforce, "workerMessageHandler");
		this.clientWorkforce.api([MESSAGE_TYPE['worker message'], 1]);
		test.ok(spy.calledWith(1));
		test.done();
	},
	messageHandlerBroadcast: function(test){
		this.clientWorkforce.api([MESSAGE_TYPE['broadcast'], 1]);
		test.ok(this.queen.workforce.calledWith(1));
		test.done();
	},
	messageHandlerKill: function(test){
		var spy = sinon.spy();
		this.clientWorkforce.api.on('dead', spy);
		this.clientWorkforce.api([MESSAGE_TYPE['kill'], 1]);
		test.ok(spy.calledOnce);
		test.done();
	},
	messageHandlerWorkerMessage: function(test){
		var idArray = [1];
		var spy = sinon.stub(this.clientWorkforce, "populateHandler");
		this.clientWorkforce.api([MESSAGE_TYPE['populate'], idArray]);
		test.ok(spy.calledWith(idArray));
		test.done();
	},
	populateHandler: function(test){
		var workerProvider = mock.workerProvider();
		var idArray = [workerProvider.id];
		this.clientWorkforce.populateHandler([idArray]);

		test.ok(this.clientWorkforce.workforce.populate.called)
		test.done();
	},
	workerHandler: function(test){
		var worker = mock.worker();
		this.clientWorkforce.workerHandler(worker);
		test.ok(this.clientWorkforce.workers[worker.id] !== void 0);
		test.done();
	},
	workerMessageHandler: function(test){
		var worker = mock.worker();
		this.clientWorkforce.workerHandler(worker);
		this.clientWorkforce.workerMessageHandler(worker.id, this.TEST_OBJECT);

		test.ok(worker.calledWith(this.TEST_OBJECT));
		test.done();
	},
	kill: function(test){
		var spy = sinon.spy();
		this.clientWorkforce.api.on('dead', spy);
		this.clientWorkforce.api.kill();
		test.ok(spy.calledOnce);
		test.done();
	}
}