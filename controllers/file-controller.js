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
	str = str+"";
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
	var path = id+"";
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
	console.log("@@ 목록조회 화면이 호출되었습니다.");
	//id별 최상위 버전 리스트 조회

	FileDao.aggregate()
	.group({
		_id: '$groupId'
		, version: { $max: '$version'}
		, key :  { $max: '$_id'}
	})
	//.sort('-version')
	.exec(function (err, gbList) {
		if (err){
			console.log(err);
			return handleError(err);
		}
		console.log("Group by list : %j", gbList);
		var condArr = new Array();
		for(var i in gbList){
			//console.log("xx:%j", gbList[i].key);
			condArr.push(gbList[i].key);
		}


		FileDao.find({ _id: { $in: condArr } }, function(err, files) {
		}).sort({regDd: -1}).exec(function(err, files){
			//console.log("files: %j", files);
			res.render('upload', {
				//title : 'NodeJs File Control by TK'
				//,files : escape(encodeURIComponent(JSON.stringify(files))) //html 사용시
				files : files //jade 사용시
			});
		});
	});




//	FileDao.find(function(err, files) {
//	}).sort({regDd: -1}).exec(function(err,files){
//		res.render('upload', {
//			title : 'NodeJs File Control by TK'
//			//,files : escape(encodeURIComponent(JSON.stringify(files))) //html 사용시
//			,files : files //jade 사용시
//		});
//	});
};

/**
 * 버전업 목록
 */
exports.uvp = function(req, res) {
	console.log("@@ 버전 목록조회 화면이 호출되었습니다.");
	var reqUrl = url.parse(req.url, true);
    var params = reqUrl.query;
    console.log("parms = %j", params);

//	var arr = new Array();
//	arr.push(1);
//	arr.push(2);
//
//	console.log(Math.max.apply(null, arr));
//
//	var o = {};
////	o.map = function () { emit(this.id, this.version) }
////	o.reduce = function (k, vals) { return Array.max(vals) }
//	o.map = function () {
//		var key = this.id;
//		var vals = {
//			version : this.version
//			,oid    : this._id
//		};
//		emit(key, vals);
//	};
//	o.reduce = function (key, vals) {
////		console.log("k:", k);
////		console.log("vals:", vals);
//		return Math.max.apply(null, vals.version);
//	};
//	o.out = { replace: 'filelist_last_version' };
//
//	FileDao.mapReduce(o, function (err, model, stats) {
////		console.log("model:", model);
////		console.log("err:", err);
//		console.log('map reduce took %d ms', stats)
//		model.find().exec(function (err, docs) {
//			console.log("docs:", docs);
//			for(var key in docs){
//			    //console.log("-- : %j", docs[key]);
//			}
//		});
//	});


//	var groupByCond = "";
//	FileDao.aggregate()
//		.group({
//			_id: '$id'
//			//,name : '$name'
//			, version: { $max: '$version' }
//			//, rank: { $push: '$version' }
//			, rank: {  $push: "$$ROOT" }
//		})
//		.sort('-version')
//		.exec(function (err, cond) {
//			if (err) return handleError(err);
//			console.log("groupByCond: %j", cond);
//
//			FileDao.find(cond, function(err, files) {
//			}).sort({version: -1}).exec(function(err, files){
//				console.log("files: %j", files);
//				res.render('updateVersion', {
//					files : files
//				});
//			});
//		});

    console.log("groupId:%j", params.groupId);

	FileDao.find({groupId:params.groupId}, function(err, files) {
	}).sort({version: -1}).exec(function(err, files){
		res.render('updateVersion', {
			files : files
		});
	});
};

/**
 * file upload
 */
exports.create = function(req, res) {
	console.log("@@ 파일업로드 실행이 호출되었습니다.");
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
			console.log("######################################");
			console.log("file key  : %s", fileKey);
			console.log("file name : %s", fileNm);
			console.log("file size : %s", fileSz);
			//console.log("file path : %s", fileFullPath);
			console.log("######################################");

			//File DB 저장 후 File Write
			var fileTmp = new FileDao({
				groupId : fileKey,
				name : fileNm,
				size : fileSz
			}).save(function(err, file){
				console.log("DB saved file Obj:%j", file);

				if (error) {
					throw err;

				} else {
					try {
						var fileFullPath = makeFolder(file._id);
					} catch (e) {
						//DB 삭제
						FileDao.findOne({ _id:file._id}, function (err, fileObj) {}).remove().exec();
						throw err;
					}

					fs.writeFile(fileFullPath + "/" + file._id, data, function(error) {
						if (error) {
							throw err;

						} else {
							res.redirect("/");
							res.end();
						}
					}); //fs.writeFile
				}
			})


//			// 파일 저장 및 에러처리
//			fs.writeFile(fileFullPath + "/" + fileKey, data, function(error) {
//
//				if (error) {
//					throw err;
//
//				} else {
//					// db 저장
//					var fileTmp = new FileDao({
//						id : fileKey,
//						name : fileNm,
//						size : fileSz
//					}).save(function(err, file){
//						console.log("file Object Id = %j", file);
//					});
//
//					res.redirect("/");
//					res.end();
//
//				}
//			}); //fs.writeFile
		});
	}
};
exports.versionUpFile = function(req, res) {
	console.log("@@ 버전업 파일업로드 실행이 호출되었습니다.");
	// bodyParser 없을 경우 req.files 에러 발생.
	console.log("req.files = %j", req.files);

	var reqUrl = url.parse(req.url, true);
    var groupId = reqUrl.query.groupId;

	var file = req.files["file"];
	fs.readFile(file.path, function(error, data) {
		var fileNm = file.name;
		var fileSz = file.size;

		/**
		 * 저장할 폴더 생성
		 */
		console.log("######################################");
		console.log("file groupId  : %s", groupId);
		console.log("file name : %s", fileNm);
		console.log("file size : %s", fileSz);
		//console.log("file path : %s", fileFullPath);
		console.log("######################################");

		// file Max version 조회
//		FileDao.findOne({id:fileKey}, function (err, fileObj) {
//
//		});

		FileDao.aggregate()
		.match({groupId:groupId})
		.group({
			_id: "$id"
			, version: { $max: '$version' }
		})
		.exec(function (err, cond) {
			if (err) return handleError(err);
			console.log("groupByCond: %j", cond);
			var ve = parseInt(cond[0].version)+1;

			console.log("ve: %j", ve);
			//File DB 저장 후 File Write
			var fileTmp = new FileDao({
				groupId : groupId
				,name : fileNm
				,size : fileSz
				,version : ve
			}).save(function(err, file){
				console.log("DB saved file Obj:%j", file);

				if (error) {
					throw err;

				} else {
					try {
						var fileFullPath = makeFolder(file._id);
					} catch (e) {
						//DB 삭제
						FileDao.findOne({ _id:file._id}, function (err, fileObj) {}).remove().exec();
						throw err;
					}

					fs.writeFile(fileFullPath + "/" + file._id, data, function(error) {
						if (error) {
							throw err;

						} else {
							res.redirect("/");
							res.end();
						}
					}); //fs.writeFile
				}
			});
		});




	});
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
	console.log("@@ 파일 다운로드가 호출되었습니다.");
	var reqUrl = url.parse(req.url, true);
    var params = reqUrl.query;
    console.log("parms = %j", params);

	FileDao.findOne({_id: params.fileId}, function (err, fileObj) {
		console.log(fileObj);
		if(null != fileObj){
			var file = getFile(fileObj._id);

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
 * 최신버전의 File 다운로드
 */
exports.downloadLatest = function(req, res) {
	console.log("@@ 파일 다운로드(Latest)가 호출되었습니다.");
	var reqUrl = url.parse(req.url, true);
	var groupId = reqUrl.query.groupId;

	FileDao
	.findOne({groupId:groupId})
	.sort({version:-1})
	.exec(function (err, fileObj) {
		console.log(fileObj);
		if(null != fileObj){
			var file = getFile(fileObj._id);
			console.log(file);

			var mimetype = mime.lookup(fileObj.name);
			res.setHeader('Content-type', mimetype);
			res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(fileObj.name));
			//res.setHeader('Content-Length', fileObj.size);

			var filestream = fs.createReadStream(file, { bufferSize: 64 * 1024 });
		    filestream.pipe(res);
		}
	});

//	FileDao.aggregate()
//	.match({groupId:groupId})
//	.group({
//		_id: "$_id"
//		, version: { $max: '$version' }
//	})
//	.exec(function (err, fileObj){
//		console.log(fileObj);
//		if(null != fileObj){
//			var file = getFile(fileObj[0]._id);
//			console.log(file);
//
//			var mimetype = mime.lookup(fileObj.name);
//			res.setHeader('Content-type', mimetype);
//			res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(fileObj.name));
//			//res.setHeader('Content-Length', fileObj.size);
//
//			var filestream = fs.createReadStream(file, { bufferSize: 64 * 1024 });
//		    filestream.pipe(res);
//		}
//	});
}

/**
 * 파일 삭제
 */
exports.remove = function(req, res) {
	console.log("@@ 파일삭제가 호출되었습니다.");
	var reqUrl = url.parse(req.url, true);
    var params = reqUrl.query;

    FileDao.findOne({ _id: params.fileId}, function (err, fileObj) {
    	try {
    		//console.log(fileObj.remove());
    		var file = getFile(fileObj._id);
    		fs.unlinkSync(file);

		} catch (e) {
			console.log(e);

		} finally {
			res.redirect("/");
			res.end();
		}

    }).remove().exec();
};
