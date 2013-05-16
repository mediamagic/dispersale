var mongoose = require('mongoose');
var db = mongoose.connection

var imagesSchema = new mongoose.Schema({
	fileName: String,
	hashName: String,
	mimeType: String,
	client:String
});

module.exports = function(extendStaticMethods, cb){

	imagesSchema.statics = extendStaticMethods('Images', ['list','add', 'get', 'delete']);
	/*
	 * Users Model
	 */
	return cb(db.model('Images', imagesSchema));
};