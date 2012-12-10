var winston = require("winston"),
	logger = new (winston.Logger)({transports: [new (winston.transports.Console)({level: 'info'}) ]}),
	createQueen = require("../").queen.create;

var pingPongExample = function(queen){
	var workerHandler = function(worker){
		worker.on('message', function(message){
			console.log(message + " (" +  worker.provider.attributes.name + ")");
			worker('pong');
		});
	};

	var workforce = queen({
		scriptPath: 'http://192.168.0.105/ping.js',
		populate: "continuous",
		stop: function(){
			console.log("Waiting for someone to connect...");
		},
		handler: workerHandler
	});
};

createQueen(pingPongExample);