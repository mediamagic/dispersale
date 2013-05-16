module.exports = function(db){
	function handle(err,doc){
		if (err)
			return err;
		return doc;
	}
	return {
		facebook: {
			load: function(req, res, next) {					
				db.powerUsers.get({'facebook.id':req.params.id}, function(err,doc){							
					if (doc) {
						req.user = doc;
						next();
					} else {
						res.send({'error' : 'User Not Found'}, 404);
					}
		  		});
			},
			show: function(req,res,next){
				return res.send(req.user);
			},
			create: function(req, res, next) {
				var data = {
					facebook:req.body
				}

				db.powerUsers.findOne({'facebook.id':data.facebook.id}, function(err, user) {					
					if(user) {
						console.log('user exists, updating new token:' + data.facebook.access_token)
						db.powerUsers.update({ _id:user._id}, {'facebook.access_token':data.facebook.access_token}, function(err,doc){							
							user.facebook.access_token = data.facebook.access_token;
							return res.send(handle(err,user));
						});
					} else {
						db.powerUsers.add(data, function(err,doc){
							return res.send(handle(err,doc));
						});
					}
				});				
			}			
		},
		create: function(req,res,next){
			var data = req.body;
			db.powerUsers.add(data, function(err,doc){
				return res.send(handle(err,doc));
			});
		},
		update: function(req,res,next){
			var id = req.user.id
				, data = req.body;
			db.powerUsers.edit({_id:id}, data, function(err,doc){
				return res.send(handle(err,doc));
			});
		},
		login: function(req,res,next){
			var username = req.body.username
	  			, password = req.body.password;
	  		if (username == undefined || password == undefined || username == '' || password == '')
	  			res.send({error: 'password required', errorcode: 531});
	  		else
		  		db.powerUsers.get({username: username}, function(err,doc){
		  			if (doc)
			  			doc.compare(password, function(err,resp){
			  				if (resp) {
			  					req.session.user_id = doc._id;
			  					res.send(handle(err,doc))
			  				} else 
			  					res.send({error: 'password incorrect', errorcode: 531});
			  			});
			  		else
			  			res.send({error: 'username does not exist', errorcode: 531});
		  		})
		  		
		}
	}
}