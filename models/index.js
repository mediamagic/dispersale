module.exports = function(cb){
	var mongoose = require('mongoose')
	, fs = require('fs')
	, async = require('async');
	//mongoose.set('debug', function(a,b,c,d,e){console.log('---'); console.log(a); console.log(b); console.log(c); console.log(d);})
	mongoose.connect('mongodb://mongo.db/dispersaleDB');
	var db = mongoose.connection
	, ObjectId = mongoose.Schema.ObjectId;

	var extendStaticMethods = function(modelName, registerArr){
		var registerArr = (registerArr === undefined) ? [] : registerArr;
		var methods = {}
		var template = {
			list: function(search, cb){
				if (search != undefined)
					try {
						delete search._csrf;
					} catch(e){
						
					}

				// this.model(modelName).find(search,{},{sort:{dateCreated: 1}},function(err,doc){
				this.find(search,{},{sort:{dateCreated: 1}},function(err,doc){
					if (err)
						return cb(err);
					return cb(null,doc);
				});
			},
			get: function(params,cb){
				//this.model(modelName).findOne(params, function(err,doc){
				this.findOne(params, function(err,doc){
					if (err)
						return cb(err);
					return cb(null,doc);
				});
			},
			add: function(data,cb){
				if (data._csrf) delete data._csrf;
				var tmp = new this(data);
				tmp.save(function(err,doc){
					if(err)
						return cb(err);
					return cb(null,doc);
				});
			},
			edit: function(params,data,cb){				
				//this.model(modelName).findOne(params, function(err,doc){
				this.findOne(params, function(err,doc){
					if (err)
						return cb(err);
					doc.set(data);
					doc.save(function(e,d){
						if (e)
							return cb(e);
						return cb(null,doc);
					});
				});
			},
			upd: function(params, data, options, cb){
				//this.model(modelName).update(params, data, options, function(err,doc){
				this.update(params, data, options, function(err,doc){
					if (err)
						return cb(err)
					return cb(null,doc);
				});
			},
			delete: function(params,cb){
				this.remove(params, function(err,doc){
					if (err)
						return cb(err);
					return cb(null,doc);
				});
			}
		}
		for (var i = 0; i < registerArr.length; i++){
			if (template[registerArr[i]] != undefined) {
				methods[registerArr[i]] = template[registerArr[i]];
			}
		}
		return methods;
	}

	function createReq(fileName){
		var tmp = fileName;
		return function(callback){
			require('./'+tmp)(extendStaticMethods, function(resp){
				callback(null,resp);
			})
		}
	}

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function () {
		fs.readdir(__dirname, function(err, files){
			files.splice(files.indexOf('index.js'),1);
			var functions = {}
			for(var i=0;i<files.length;i++){
				var func = createReq(files[i])
				functions[files[i].split('.')[0]] = func;
			}
			async.parallel(functions, function(err, results){
				return cb(results);
			});
		})
	});
}