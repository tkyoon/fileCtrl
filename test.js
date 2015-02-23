/**
 * New node file
 */
var fs = require('fs');

var path = "abcdef";

//fs.mkdir("c:/ab/cd", function(exists){});

fs.mkdir("c:/ab/cd", 0777, true, function (err) {
	  if (err) {
	    console.log(err);
	  } else {
	    console.log('Directory ' + directory + ' created.');
	  }
});