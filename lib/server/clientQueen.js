var EventEmitter = require("events").EventEmitter,
	net = require('net'),
	precondition = require('precondition');

var utils = require('../utils'),
	MESSAGE_TYPE = require('../protocol.js').QUEEN_MESSAGE_TYPE,
	createClientWorkforce = require('./clientWorkforce.js'),
	createClientWorkerProvider = require('./clientWorkerProvider.js');

var create = module.exports = function(socket, queen, options){
	var client = new ClientQueen(socket, queen);

	options = options || {};
	if(options.log) client.log = options.log;
	if(options.debug) client.debug = options.debug;

	return client;
};

var ClientQueen = function(socket, queen){
	precondition.checkDefined(socket, "ClientQueen requires a socket");
	precondition.checkDefined(queen, "ClientQueen requires a queen instance");

	this.socket = socket;
	this.queen = queen;
	this.workforces = {};
	this.workerProviders = {};

	socket.on('data', this.messageHandler.bind(this));
	
	this.workerProviderHandler = this.workerProviderHandler.bind(this);
	
	// Emit existing workerProviders
	queen.workerProviders.forEach(this.workerProviderHandler);
	// Listen to all future workerProviders
	queen.on('workerProvider', this.workerProviderHandler);
	this.kill = utils.once(this.kill.bind(this));

	socket.on('close', this.kill);
	socket.on('end', this.kill);
	socket.on('error', this.kill);

	this.sendToSocket([MESSAGE_TYPE['ready']]);
};

ClientQueen.prototype.log = utils.noop;
ClientQueen.prototype.debug = utils.noop;
ClientQueen.prototype.trackWorkerProviders = false;

ClientQueen.prototype.kill = function(){
	this.sendToSocket = utils.noop;
	utils.each(this.workforces, function(workforce){
		workforce.kill();
	});

	utils.each(this.workerProviders, function(workerProvider){
		workerProvider.kill();
	});

	this.queen.removeListener('workerProvider', this.workerProviderHandler);
};

ClientQueen.prototype.sendToSocket = function(message){
	this.socket.write(message);		
};

ClientQueen.prototype.messageHandler = function(message){
	switch(message[0]){
		case MESSAGE_TYPE['workforce message']:
			this.workforceMessage(message[1], message[2]);
			break;
		case MESSAGE_TYPE['create workforce']:
			this.createWorkforce(message[1], message[2]);
			break;
		case MESSAGE_TYPE['track worker provider']:
			this.trackWorkerProviders = message[1] === true;
			break;
		default:
			this.debug("Unhandled message: " + JSON.stringify(message));
			break;
	}
};

ClientQueen.prototype.workforceMessage = function(workforceId, message){
	var workforce = this.workforces[workforceId];

	if(workforce !== void 0){
		workforce(message);
	} else {
		this.debug("Workforce doesn't exist: " + JSON.stringify(workforceId));
	}
};

ClientQueen.prototype.workerProviderHandler = function(queenWorkerProvider){
	var self = this,
		onSendToSocket,
		clientWorkerProvider;

	onSendToSocket = function(workerProviderMessage){
		if(self.trackWorkerProviders){
			self.sendToSocket([
				MESSAGE_TYPE['worker provider message'],
				queenWorkerProvider.id,
				workerProviderMessage
			]);
		}
	};

	clientWorkerProvider = createClientWorkerProvider(queenWorkerProvider, onSendToSocket);
	
	this.workerProviders[queenWorkerProvider.id] = clientWorkerProvider;
	
	clientWorkerProvider.on('dead', function(){
		self.workerProviders[queenWorkerProvider.id].kill();
		delete self.workerProviders[queenWorkerProvider.id];
	});

	this.sendToSocket([
		MESSAGE_TYPE['create worker provider'],
		queenWorkerProvider.id,
		queenWorkerProvider.attributes
	]);
};

ClientQueen.prototype.createWorkforce = function(remoteId, workforceConfig){
	var self = this,
		workforce,
		onSendToSocket;
	
	onSendToSocket = function(workforceMessage){
		self.sendToSocket([
			MESSAGE_TYPE['workforce message'],
			remoteId,
			workforceMessage
		]);
	};

	workforce = createClientWorkforce(this.queen, workforceConfig, onSendToSocket);

	this.workforces[remoteId] = workforce;

	workforce.on('dead', function(){
		delete self.workforces[remoteId];
	});
};