var mongoose = require('mongoose');
var db = mongoose.connection
/*
 * Statistics Schema
 */
var salesSchema = new mongoose.Schema({	
	item:String, // the item id that was purchased
	client:String, // we can get the client id from the item but we better save it for faster queries when wanting a list of sales for a special client
	user:String, // user id who made the purchase
	token:String, // saving the token for later validation
	transaction:String, // transaction id
	incentive: { // saving the current incentive so if a change as bean made after the sale, the user will get what he was told about at that moment
		amount:Number,
		total:Number
	},
	publish:{type:Boolean, default:false},
	status:{ type:Number, default:2} // 1=approved, 2=pending, 3=canceled
});


module.exports = function(extendStaticMethods, cb) {
	salesSchema.statics = extendStaticMethods('Sales', ['list', 'add', 'get', 'edit']);

	return cb(db.model('Sales', salesSchema));
}