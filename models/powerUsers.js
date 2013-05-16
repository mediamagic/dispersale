var mongoose = require('mongoose')
	, db = mongoose.connection
	, crypto = require('../lib/crypto')
/*
 * Power Users Schema
 */
var powerUsersSchema = new mongoose.Schema({
	//username: {type: String, required: true, index: {unique:true} },
	//password: {type: String, required: true},
	username: {type: String, index: {unique:true} },
	password: {type: String},
	salt: {type: String},
	email: String,
	lastLogin: {type: Date, default: Date.now},
	lastIp: String,
	level: {type:Number, default:1}, 
	name: {
		first: String,
		last: String
	},
	allowedDomains:[],
	status:Number, // 1=active, others.......
	shopBaseUrl:String,
	facebook: {},
	dateCreated: {type: Date, default: Date.now}
});


module.exports = function(extendStaticMethods, cb) {
	/*
	 * Power Users Manipulation
	 */
	powerUsersSchema.statics = extendStaticMethods('powerUsers', ['get','add', 'edit']);
	powerUsersSchema.pre('save', function(next) {
		var user = this;
		if (!user.isModified('password')) {
			console.log('immediate return');
			return next();
		}
		crypto.hasher({password: user.password}, function(err, usr) {
			console.log('create user');
			if (err) return next(err);
			user.password = usr.key;
			user.salt = usr.salt;
			return next();
		});
	});
	powerUsersSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
		crypto.compare(	{ hashed: this.password
						, unhashed: candidatePassword
						, salt: this.salt }
						, function(err, isMatch) {
							if (err) return cb(err);
							cb(null, isMatch);
						});
	};

	/*
	 * Power Users Model
	 */
	var powerUsers = db.model('powerUsers', powerUsersSchema);

	/*
	 * Power Users Auto-Populate master user
	 */
	powerUsers.count({}, function(err,c){
		if(err) {
			return cb(err);
		}
		if (c == 0) {
			var defaultPowerUser = {
				username: 'Admin',
				password: '$cookies2013!',
				email: 'info@mediamagic.co.il',
				level: 1,
				name: {
					first: 'Master',
					last: 'Admin'
				}
			}
			powerUsers.add(defaultPowerUser, function(err, doc){
				if(err) {
					return cb(err);
				}
				return cb(doc);
			});
		} else  {
			return cb(powerUsers);
		}
	});
}
