
var fs = require('fs');

/**
 * file index
 */
exports.index = function(req, res){
	console.log("@@ Call file index page");
	res.send("file index Page");
};

/**
 * file upload
 */
exports.upload = function(req, res){
	console.log("@@ Call file upload!");
	// bodyParser 없을 경우 req.files 에러 발생.
	fs.readFile(req.files.uploadFile.path, function (error, data) {
		// 저장할 파일 경로를 지정 합니다.
		var fileRepository = "C:/Dev/Eclipse/Luna-Workspace/jcone-uar-nodejs/repository/";
		var filePath = fileRepository + req.files.uploadFile.name;
		console.log("filePath : " + filePath);
		// 파일 저장 및 에러처리
		fs.writeFile(filePath, data, function (error) {
			if (error) {
				throw err;
			} else {
				res.redirect("back");
			}
		});
	});

};