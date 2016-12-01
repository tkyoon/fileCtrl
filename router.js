// binding task controller
var fileCtrl = require('./controllers/file-controller.js');

// exports route function for app.js, take express() as argument
exports.route = function(app){

	fileCtrl.setFileRoot(app.get("repo"));

	//get
	app.get('/', fileCtrl.list);
	app.get('/UpdateVersionPop', fileCtrl.uvp);
	app.get('/downloadFile', fileCtrl.download);
	app.get('/downloadLatest', fileCtrl.downloadLatest);
	app.get('/removeFile', fileCtrl.remove);

	//post
	app.post('/createFile', fileCtrl.create);
	app.post('/versionUpFile', fileCtrl.versionUpFile);
};