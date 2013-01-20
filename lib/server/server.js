var jot = require('json-over-tcp'),
	its = require('its');

var createClientQueen = require('./clientQueen.js'),
	utils = require('../utils.js');

var create = module.exports = function(queen, options){
	options = options || {};
	var host = options.host || "",
		hostArr = host.split(":"),
		hostname = hostArr[0],
		port = hostArr[1] || 9200,
		netServer = options.server || jot.createServer().listen(port || 9200, hostname),
		server = new Server(queen, netServer);

	if(options.log) server.log = options.log;
	if(options.debug) server.debug = options.debug;

	if(options.server === void 0){
		server.log('[Queen Remote Server] Accepting connections on ' + (hostname!==void 0?hostname:"*")  + ":" + port + "\n");
	}

	return server;
};

var Server = function(queen, netServer){
	its.object(queen, "queen instance required");
	this.netServer = netServer;
	this.queen = queen;

	this.netServer.on('connection', this.connectionHandler.bind(this));
};

Server.prototype.log = utils.noop;
Server.prototype.debug = utils.noop;

Server.prototype.connectionHandler = function(connection){
	var self = this,
		remoteHost = connection.remoteAddress + ":" + connection.remotePort,
		client;

	this.log('[Queen Remote Server] Remote connection established: ' + remoteHost + "\n");
	
	client = createClientQueen(connection, this.queen, {log: this.log, debug: this.debug});
	client.on('dead', function(){
		self.log('[Queen Remote Server] Remote connection closed: ' + remoteHost + "\n");
	});
};