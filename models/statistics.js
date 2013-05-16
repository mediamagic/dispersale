var mongoose = require('mongoose');
var db = mongoose.connection
/*
 * Statistics Schema
 */
var referenceSchema = new mongoose.Schema({
	ref: {type: Number, default: 0, index: true},
	count: Number
});

var sharesSchema = new mongoose.Schema({
	ref: {type: String, index: true},
	count: Number
});


module.exports = function(extendStaticMethods, cb) {
	referenceSchema.statics = extendStaticMethods('References', ['list', 'upd']);
	sharesSchema.statics = extendStaticMethods('Shares', ['list', 'upd']);

	var obj = 	{ Refs: db.model('References', referenceSchema)
				, Shares: db.model('Shares', sharesSchema) }
	return cb(obj);
}