var workerHandler = function(worker){
	worker.on('message', function(message){
		console.log(message + " (" +  worker.provider.attributes.name + ")");
		worker('pong');
	});
};

var workforce = queen({
	scriptPath: 'http://localhost/example/ping.js',
	populate: "continuous",
	stop: function(){
		console.log("Waiting for someone to connect...");
	},
	killOnStop: false,
	handler: workerHandler
});