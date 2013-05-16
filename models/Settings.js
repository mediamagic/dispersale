var mongoose = require('mongoose');
var db = mongoose.connection
/*
 * Settings Schema
 */
var settingsSchema = new mongoose.Schema({
	title: String,
	facebook: {
		shareTitle: String,
		shareText: String,
		shareReference: Number
	},
	tax:Number,
	commision:Number
});
module.exports = function(extendStaticMethods, callback) {
	/*
	 * Settings Manipulation
	 */
	settingsSchema.statics = extendStaticMethods('Settings', ['list', 'edit']);
	settingsSchema.statics.populate = function(data,cb){

		this.model('Settings').find({}, function(err,doc){
			if (err)
				return cb(err)
			if (typeof(doc) == 'null' || typeof(doc) == 'undefined' || doc.length == 0) {
				var data = 	{ title: 'Dispersale'}
					, Settings = db.model('Settings', settingsSchema)
					, tmp = new Settings(data);
				tmp.save(function(err,doc){
					if (err)
						return cb(err)
					return cb(doc);
				});
			} else {
				return cb();
			}
		});
	}
	settingsSchema.statics.list = function(params, cb){
		this
			.model('Settings')
			.findOne(params,{},{sort:{dateCreated: 1}})
			.lean()
			.exec(function(err,doc){
				if (err)
					return cb(err);
				return cb(null,doc);
		});
	}
	/*
	 * Settings Model
	 */
	var Settings = db.model('Settings', settingsSchema);

	/*
	 * Settings Auto-populate
	 */

	Settings.count({}, function(err,c){
		if(err)
			return err;
		if (c == 0) {
			Settings
				.populate({title: 'Dispersale'}, function(err, doc){
					if(err)
						return err;
					return callback(Settings);
				});
		} else {
			return callback(Settings);
		}
	})
}