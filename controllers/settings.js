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
		index: function(req,res,next){
			db.Settings.list({}, function(err,doc){
				return res.send(handle(err,doc));
			});
		},
		update: function(req,res,next){
			var id = req.params.id
				, data = req.body;
			db.Settings.edit({}, data, function(err,doc){
				return res.send(handle(err,doc));
			});
		},
		updateCategories: function(req,res,next){
			var key = req.params.key
				, name = req.body.name
			db.Settings.findOne({}, function(err,doc){
				var itm = JSON.parse(JSON.stringify(doc.categories));
				itm[key] = name;
				doc.categories = itm;
				doc.markModified('categories'); 
				doc.save(function(err,doc){
					if (err) return res.send(err);
					return res.send(itm);
				});
			})
		},
		createCategory: function(req,res,next){
			var  key = 'cat_' + (new Date().getTime()).toString(36)
				, name = req.body.name;
			db.Settings.findOne({}, function(err,doc){
				var itm = JSON.parse(JSON.stringify(doc.categories));
				itm[key] = name;
				doc.categories = itm;
				doc.save(function(err,doc){
					if (err) return res.send(err);
					return res.send({key: key});
				});
			})
		},
		deleteCategory: function(req,res,next){
			var key = req.params.key
			db.Settings.findOne({}, function(err,doc){
				var itm = JSON.parse(JSON.stringify(doc.categories));
				delete itm[key];
				doc.categories = itm;
				doc.save(function(err,doc){
					if (err) return res.send(err);
					return res.send({key:key});
				});
			})
		}
	}
}