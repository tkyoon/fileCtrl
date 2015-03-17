var fs = require('fs');
var url = require('url');
var uuid = require('node-uuid');
var FileDao = require('../models/fileDao.js');
var mkdirp = require('mkdirp');
var path = require('path');
var mime = require('mime');
var sys = require("sys");

var filePath = "C:/nodejs.repo/"

function makeFolder(str) {
	var pattern = /(-?\w+)(\w{2})/;
	while (pattern.test(str)) {
		str = str.replace(pattern, "$1/$2");
	}

	mkdirp.sync(filePath + str, function(err) {
		if (err) {
			console.error(err)
		}else{
			console.log(filePath + str);
		}
	});

	return filePath + str;
}

/**
 * Repository 저장소로부터 저장된 파일 path를 가져옴
 * @param id
 * @returns {String} ex) c:/repository/ab/cd/..../abcdefghijklmn
 */
function getFile(id) {
	var path = id;
	var pattern = /(-?\w+)(\w{2})/;
	while (pattern.test(path)) {
		path = path.replace(pattern, "$1/$2");
	}

	return filePath + path + "/" + id;
}

/**
 * file list page
 */
exports.list = function(req, res) {
	console.log("@@ Call file list page");
	FileDao.find(function(err, files) {
	}).sort({regDd: -1}).exec(function(err,files){
		res.render('upload', {
			title : 'NodeJs File Control by TK'
			,files : escape(encodeURIComponent(JSON.stringify(files)))
			//,files : files
		});
	});


};

/**
 * file upload
 */
exports.create = function(req, res) {
	console.log("@@ Call file upload!");
	// bodyParser 없을 경우 req.files 에러 발생.
	console.log("req.files = %j", req.files);

	for (var i in req.files) {
		var file = req.files[i];
		fs.readFile(file.path, function(error, data) {
			var fileKey = uuid.v1().replace(/-/gi, "");
			var fileNm = file.name;
			var fileSz = file.size;

			/**
			 * 저장할 폴더 생성
			 */
			var fileFullPath = makeFolder(fileKey);

			console.log("######################################");
			console.log("file key  : %s", fileKey);
			console.log("file name : %s", fileNm);
			console.log("file size : %s", fileSz);
			console.log("file path : %s", fileFullPath);
			console.log("######################################");

			// 파일 저장 및 에러처리
			fs.writeFile(fileFullPath + "/" + fileKey, data, function(error) {

				if (error) {
					throw err;

				} else {
					// db 저장
					var fileTmp = new FileDao({
						id : fileKey,
						name : fileNm,
						size : fileSz
					}).save();
					console.log("fileTmp = %j", fileTmp);
					res.redirect("/");
					res.end();

				}
			}); //fs.writeFile
		});
	}
};

/**
 * file download
 *
 * ex)
 * var downloadfile = fs.createWriteStream(filename, {'flags': 'a'});
        sys.puts("File size " + filename + ": " + response.headers['content-length'] + " bytes.");
        response.addListener('data', function (chunk) {
            dlprogress += chunk.length;
            downloadfile.write(chunk, encoding='binary');
        });
        response.addListener("end", function() {
            downloadfile.end();
            sys.puts("Finished downloading " + filename);
        });

 */
exports.download = function(req, res) {
	var reqUrl = url.parse(req.url, true);
    var params = reqUrl.query;
    //console.log("parms = %j", params);

	FileDao.findOne({ id: params.fileId, version : params.version }, function (err, fileObj) {
		console.log(fileObj);
		if(null != fileObj){
			var file = getFile(fileObj.id);

			var mimetype = mime.lookup(fileObj.name);
			res.setHeader('Content-type', mimetype);
			res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(fileObj.name));
			//res.setHeader('Content-Length', fileObj.size);

			var filestream = fs.createReadStream(file, { bufferSize: 64 * 1024 });
		    filestream.pipe(res);


/*
 *
 * 			var downloadfileStream = fs.createWriteStream(file);
			var mimetype = mime.lookup(fileObj.name);
			res.setHeader('Content-type', mimetype);
			res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(fileObj.name));
			res.setHeader('Content-Length', fileObj.size);
			res.download(file);

			downloadfileStream
			.on('drain', function()          { console.log('write: drain'.yellow); })
			.on('error', function(e)         { console.log('write: error' ); })
			.on('close', function()          { console.log('write: close' ); })
			.on('pipe',  function(src)       { console.log('write: pipe'  ); })
			;
*/			/**
			 *  org
			 *
			var outputFile = fs.readFileSync(file, 'binary');
			var mimetype = mime.lookup(fileObj.name);

			res.setHeader('Content-type', mimetype);
			res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(fileObj.name));
			res.setHeader('Content-Length', fileObj.size);
			res.write(outputFile, 'binary');
			res.end();
			 */
		}
	});
};

/**
 * 파일 삭제
 */
exports.remove = function(req, res) {
	var reqUrl = url.parse(req.url, true);
    var params = reqUrl.query;

    FileDao.findOne({ id: params.fileId, version : params.version }, function (err, fileObj) {
    	try {
    		//console.log(fileObj.remove());
    		var file = getFile(fileObj.id);
    		fs.unlinkSync(file);

		} catch (e) {
			console.log(e);

		} finally {
			res.redirect("/");
			res.end();
		}

    });
};
