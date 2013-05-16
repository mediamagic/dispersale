var mongoose = require('mongoose');
var db = mongoose.connection

var tokensSchema = new mongoose.Schema({
	token: String,
	sale: String,
	item: String,
	client:String,
	user:String,
	action:String,
	ip:String,
	referer:String
});

module.exports = function(extendStaticMethods, cb){

	tokensSchema.statics = extendStaticMethods('Tokens', ['list','add', 'get']);
	/*
	 * Users Model
	 */
	return cb(db.model('Tokens', tokensSchema));
};