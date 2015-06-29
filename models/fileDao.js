// binding modules
var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

// declare file shema
var fileSchema = new Schema({
    //objectId	: String 시스템 생성, unique key
	groupId		: String // group key
    ,version	: { type: Number, "default" : 1 }
    ,name		: String
    ,size		: Number
    ,isDel		: { type: Boolean, 	"default" : false }
    ,dnCnt		: { type: Number, 	"default" : 0 }
    ,volId		: { type: String, 	"default" : "VOL_001" }
    ,isEnc		: { type: Boolean, 	"default" : false }
    ,encType	: { type: String, 	"default" : "none" }
    ,regId		: String
    ,regDd		: { type: Date, 	"default" : Date.now }
});

// exports model for file-controller
module.exports = mongoose.model('file', fileSchema);