/**
 * Module dependencies.
 */
var express = require('express')
//	, routes = require('./routes')
//	, user = require('./routes/user')
//	, file = require('./routes/file')
	, http = require('http')
	, path = require('path')
var methodOverride = require('method-override');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('repo', __dirname + '\\repo\\');
app.engine('html', require('ejs').renderFile);
//app.set('view engine', 'html');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
//app.use(express.bodyParser());
//app.use(bodyParser.urlencoded({ extended: false }));
//app.use(bodyParser.json());
//app.use(express.methodOverride());
app.use(methodOverride('X-HTTP-Method-Override'));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.locals.moment = require('moment'); //날짜포맷변경 Component

// development only
if ('development' == app.get('env')){
	app.use(express.errorHandler());
}

//routing setting
require('./router.js').route(app);

//create connection pool for MongoDB, just do it once when sever has created.
require('./db.js').connect();

http.createServer(app).listen(app.get('port'), function() {
	console.log("###############################################");
	console.log('File server Start, Open port : ' + app.get('port'));
	console.log("###############################################");
});
