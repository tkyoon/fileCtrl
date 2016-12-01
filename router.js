// binding task controller
var fileCtrl = require('./controllers/file-controller.js');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

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
	app.post('/createFile', multipartMiddleware, fileCtrl.create);
	app.post('/versionUpFile', fileCtrl.versionUpFile);
};