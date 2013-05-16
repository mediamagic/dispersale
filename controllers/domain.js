
var tldextract = require('tldextract')

module.exports = function(db){
	function handle(err,doc){
		if (err)
			return err;
		return doc;
	}
	return {
		validate: function(req,res,next){
			var referer = req.headers.referer;
			var clientId = null;
    
		    try {
		      clientId = JSON.parse(new Buffer(req.query.key, 'base64').toString());
		    } catch(e) {}

    
		    if(!referer || !clientId)
		      return res.send(401);

		    tldextract(referer, function (err, obj) {
		      var domain = obj.domain + '.' + obj.tld;
		      
		      db.powerUsers.findOne({_id:clientId, allowedDomains:domain}, function(err, user){
		    
		        if(user._id) {        
		          res.header('Access-Control-Allow-Origin', req.headers.origin);		          

		          next()
		        } else {
		          return res.send(401);
		        }
		      });

		    });
		}
	}
}