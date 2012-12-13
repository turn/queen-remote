var winston = require("winston"),
	logger = new (winston.Logger)({transports: [new (winston.transports.Console)({level: 'info'}) ]}),
	createQueenClient = require("../").client;

var chanceExample = function(queen){
	var startTime = (new Date()).getTime(),
		maxNumber = 1000,
		numberToFind = 42,
		workforce = queen({
			scriptPath: 'http://localhost/example/chance.js',
			populate: "continuous",
			handler: function(worker){
				worker(maxNumber);
			},
			stop: function(){
				console.log('Waiting for workers to connect...');
			},
			killOnStop: false
		});

	workforce.on('message', function(number, worker){
		console.log(number + " [" + worker.provider.attributes.name + "]");
		if(number === 42){
			var endTime = (new Date()).getTime(),
				secondsToComplete = (endTime - startTime) / 1000;

			console.log('Done! That took ' + secondsToComplete + " seconds. The winner was " + worker.provider.attributes.name);
			workforce.kill();
			process.exit(0);
		}
	});
};

createQueenClient(chanceExample);