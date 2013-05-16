
var fs = require('fs')

module.exports = function(db){
	function handle(err,doc){
		if (err)
			return err;
		return doc;
	}
	return {
		loadJS: function(req,res,next){
			fs.readFile(global.root + '/public/javascripts/dispersale.js', 'utf8', function(err, data) { 
		      res.setHeader('Content-Type', 'text/javascript');      
		      data = data.replace('**KEY**', req.query.key);
		      data = data.replace('**SERVER_HOST**', 'node.mediamagic.co.il:50050');
		      res.send(data);
		    });
		}
	}
}