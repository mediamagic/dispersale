module.exports = function(db){
	function handle(err,doc){
		if (err)
			return err;
		return doc;
	}
	return {
		/*
		 * Settings Operations
		 */
		load: function(req, res, next) {					
			db.Items.get({_id:req.params.id, client:req.session.passport.user}, function(err,doc){							
				if (doc) {
					req.item = doc;
					next();
				} else {
					//res.send({'error' : 'Item Not Found'}, 404);
					res.send({ error:'Item Not Found'});
				}
	  		});
		},
		show: function(req,res,next){
			return res.send(req.item);
		},
		index: function(req,res,next){			
			//db.Items.find({client:req.session.passport.user},{},{},function(err,doc){
			db.Items.list({client:req.session.passport.user}, function(err,doc){
				res.send(handle(err,doc));
			});
		},
		update: function(req,res,next){			
			var id = req.item.id			
			, data = req.body;

			db.Items.edit({_id:id}, data, function(err,doc){
				return res.send(handle(err,doc));
			});
		},
		create: function(req,res,next){			
			var data = req.body;
			data.client = req.session.passport.user;
			
			db.Items.add(data, function(err,doc){
				res.send(handle(err,doc));
			});
		}
	}
}