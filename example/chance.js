var winston = require("winston"),
	logger = new (winston.Logger)({transports: [new (winston.transports.Console)({level: 'info'}) ]}),
	createQueen = require("../").queen.create;

var chanceExample = function(queen){
	var startTime = (new Date()).getTime(),
		maxNumber = 1000,
		numberToFind = 42,
		workforce = queen({
			scriptPath: 'http://192.168.0.105/chance.js',
			populate: "continuous",
			handler: function(worker){
				worker(maxNumber);
			},
			stop: function(){
				console.log('Waiting for workers to connect...');
			}
		});


	workforce.on('message', function(number, worker){
		console.log(number + " (" + worker.provider.attributes.name + ")");
		if(number === 42){
			var endTime = (new Date()).getTime(),
				secondsToComplete = (endTime - startTime) / 1000;

			console.log('Done! That took ' + secondsToComplete + " seconds. The winner was " + worker.provider.attributes.name);
			workforce.kill();
		}
	});
};

createQueen(chanceExample);