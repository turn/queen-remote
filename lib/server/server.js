var jot = require('json-over-tcp'),
	precondition = require('precondition');

var createClientQueen = require('./clientQueen.js'),
	utils = require('../utils.js');

var create = module.exports = function(queen, options){
	options = options || {};
	var host = options.host,
		port = options.port || 9200,
		netServer = options.server || jot.createServer()
			.listen(options.port || 9200, host
			),
		server = new Server(queen, netServer);

	if(options.log) server.log = options.log;
	if(options.debug) server.debug = options.debug;

	if(options.server === void 0){
		server.log('Listening for remote requests on ' + (host!==void 0?host:"*")  + ":" + port);
	}

	return server;
};

var Server = function(queen, netServer){
	precondition.checkDefined(queen, "ControlServer requires a queen instance");
	this.netServer = netServer;
	this.queen = queen;

	this.netServer.on('connection', this.connectionHandler.bind(this));
};

Server.prototype.log = utils.noop;
Server.prototype.debug = utils.noop;

Server.prototype.connectionHandler = function(connection){
	var self = this;
	var remoteHost = connection.remoteAddress + ":" + connection.remotePort;

	this.log('Remote connection established: ' + remoteHost);
	var client = createClientQueen(connection, this.queen, {log: this.log, debug: this.debug});
	client.on('dead', function(){
		self.log('Remote connection closed: ' + remoteHost);
	});
};