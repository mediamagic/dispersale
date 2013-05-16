module.exports = function(db){
	function handle(err,doc){
		if (err)
			return err;
		return doc;
	}
	return {
		report: function(tokenData) {
			db.Tokens.add(tokenData, function(err, doc) {});
		},
		encode: function(value) {
			var encoded = null;

			try {
				encoded = new Buffer(JSON.stringify(value)).toString('base64');
			} catch(e) {}

			return encoded;			
		},
		decode: function(value) {
			var decoded = null;

			try {
				decoded = JSON.parse(new Buffer(value, 'base64').toString())	
			} catch(e) {}

			return decoded;			
		},
		generate: function(tokenData) {
			var token = {};

			for (var key in tokenData) {		        
		    	token[key] = tokenData[key];
		    }

			delete token.action;
			delete token.ip;
			delete token.referer;
			
			var encodedToken = this.encode(token);

			var data = {
				token:encodedToken,
				sale:tokenData.sale,
				item:tokenData.item,
				client:tokenData.client,
				user:tokenData.user,
				action:tokenData.action,
				ip:tokenData.ip,
				referer:tokenData.referer
			}

			this.report(data)

			return encodedToken;
		}
	}
}