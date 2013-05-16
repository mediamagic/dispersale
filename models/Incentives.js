var mongoose = require('mongoose');
var db = mongoose.connection
/*
 * Statistics Schema
 */
var incentivesSchema = new mongoose.Schema({
	originSale:String, // the approved sale who gave the user the incentive
	sale:String,
	client: String,	
	item: String,	
	user: String,
	incentive:{},
	status:{ type:Number, default:1} // 1=not paid, 2= paid...
});


module.exports = function(extendStaticMethods, cb) {
	incentivesSchema.statics = extendStaticMethods('Incentives', ['list', 'add', 'get']);

	return cb(db.model('Incentives', incentivesSchema));
}