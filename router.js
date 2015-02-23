// binding task controller
var fileCtrl = require('./controllers/file-controller.js');

// exports route function for app.js, take express() as argument
exports.route = function(app){
	app.get('/', fileCtrl.list);
	app.post('/createFile', fileCtrl.create);
	app.get('/downloadFile', fileCtrl.download);
//	app.post('/updateFile', fileCtrl.update);
//	app.post('/removeFile', fileCtrl.remove);
};