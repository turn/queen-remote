exports.QUEEN_MESSAGE_TYPE = {
	"create workforce": 1, // [1, WORKFORCE_ID, WORKFORCE_CONFIG]
	"workforce message": 2, // [2, WORKFORCE_ID, WORKFORCE_MESSAGE]
	"track worker providers": 3, // [3, TRACk_WORKER_PROVIDERS]
	"create worker provider": 4, // [4, WORKER_PROVIDER_ID, WORKER_PROVIDER_ATTRIBUTES]
	"worker provider message": 5, // [5, WORKER_PROVIDER_ID, WORKER_PROVIDER_MESSAGE]
	"ready": 6 // [6]
};

exports.WORKER_PROVIDER_MESSAGE_TYPE = {
	"worker spawned": 1, // [1, WORKER_ID]
	"worker dead": 2, // [2, WORKER_ID]
	"unavailable":3, // [3]
	"available":4 // 4
};

exports.WORKFORCE_MESSAGE_TYPE = {
	"worker message": 1, // [1, WORKER_ID, WORKER_MESSAGE]
	"broadcast": 2, //[2, MESSAGE]
	"kill": 3, // [3]
	"populate": 4, // [4, PROVIDER_IDS]
	"add worker": 5, // [5, WORKER_ID, PROVIDER_ID]
	"stop": 6, // [6]
	"worker dead": 7 // [7, WORKER_ID, REASON]
};