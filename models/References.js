var mongoose = require('mongoose');
var db = mongoose.connection
/*
 * Statistics Schema
 */
var referencesSchema = new mongoose.Schema({
	item: String,
	host: String,
	coupon: {},
	status:{ type:Number, default:1} // 1=active, 2=inactive...
});


module.exports = function(extendStaticMethods, cb) {
	referencesSchema.statics = extendStaticMethods('References', ['list', 'add', 'get']);

	return cb(db.model('References', referencesSchema));
}