var crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'buffer';

var hasher = function(opts, cb){
	if (typeof(opts) == 'function') {
		cb = opts
		opts = {}
	}
	if (!opts.password)
		return crypto.randomBytes(6, function(err,buff){
			if (err) cb(err)
			opts.password = buff.toString('base64')
		})
	if (!opts.salt) {
		opts.salt = crypto.randomBytes(64).toString('base64');
	}
	opts.hash = 'sha1'
	opts.iterations = (opts.iterations) ? opts.iterations:10000
	crypto.pbkdf2(opts.password, opts.salt, opts.iterations, 64, function(err,key){
		if (err) cb(err);
		opts.key = new Buffer(key).toString('base64')
		cb(null,opts);
	})
}

module.exports.hasher = hasher;

module.exports.compare = function(opts, cb){
	if (!opts.hashed)
		return cb('no password provided')
	if (!opts.unhashed)
		return cb('no plain pass provided')
	if (!opts.salt)
		return cb('no salt provided')
	hasher({password: opts.unhashed, salt: opts.salt}, function(err, resp){
		var ret =  (resp.key === opts.hashed) ? true : false;
		console.log(ret);
		return cb(null,ret);
	})
}