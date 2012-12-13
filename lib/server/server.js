var jot = require('json-over-tcp'),
	precondition = require('precondition');

var createClientQueen = require('./clientQueen.js'),
	utils = require('../utils.js');

var create = module.exports = function(queen, options){
	options = options || {};
	var netServer = options.server || jot.createServer()
			.listen(options.port || 9200, 
				options.host || "localhost"
			),
		server = new Server(queen, netServer);

	if(options.logger) server.log = options.logger;

	return server;
};

var Server = function(queen, netServer){
	precondition.checkDefined(queen, "ControlServer requires a queen instance");
	this.netServer = netServer;
	this.queen = queen;

	this.netServer.on('connection', this.connectionHandler.bind(this));
};

Server.prototype.log = utils.noop;

Server.prototype.connectionHandler = function(connection){
	createClientQueen(connection, this.queen, {logger: this.log});
};