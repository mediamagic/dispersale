var mongoose = require('mongoose');
var db = mongoose.connection
/*
 * Statistics Schema
 */
var itemsSchema = new mongoose.Schema({	
	client:String,
	identifier:String,
	name:String,
	model:String,
	share:{
		title:String,
		description:String,
		image:String
	},
	incentive:Number,
	path:String,	
	coupon: {		
		discount:Number,
		enabled:{type:Boolean, default:false}
	},
	sales:{type:Number, default:0}, //num of sales for this item
	status:{ type:Number, default:4} // 1=active, 2=pending, 3=disabled, 4=inactive
});


module.exports = function(extendStaticMethods, cb) {
	itemsSchema.statics = extendStaticMethods('Items', ['list','get','add','edit']);

	return cb(db.model('Items', itemsSchema));
}