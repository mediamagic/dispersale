
var httprequest = require('request');
var queryString = require('querystring');

module.exports = function(db){
	function handle(err,doc){
		if (err)
			return err;
		return doc;
	}
	return {
		graph: {
			feed: {
				post: function(uid, access_token, data, next) {
					request('POST', '/' + uid + '/feed?access_token=' + access_token, data, next);
				}
			}
		}		
	}
}

function request(method, action, data, next) {
httprequest(      
	{
		method:method,
		uri:'https://graph.facebook.com' + action,
		body:queryString.stringify(data)
	},
	function (error, response, body) {
		next(error, response, body);
	});
}