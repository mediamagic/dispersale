var fs 	= require('fs')
module.exports = function(db){
	function handle(err,doc){
		if (err)
			return err;
		return doc;
	}
	return {
		load: function(req, res, next) {
			db.Images.get({_id:req.params.id},function(err,doc){
				if (doc) {
					req.image = doc;
					next();
				} else {
					res.send({'error' : 'Image Not Found'}, 404);
				}
	  		});
		},
		show: function(req, res, next) {
			// var imageUrl = 'http://node.mediamagic.co.il:50050/images/products/' + req.image.client + '/' + req.image.hashName;
			// res.writeHead(302, { Location:imageUrl });
			// return res.end();

			fs.readFile(global.root + '/public/images/products/' + req.image.client + '/' + req.image.hashName, function(err, data) {	
				res.setHeader('Content-Type', req.image.mimeType);				
				res.send(data);
			});
		},
		index: function(req,res,next){
			db.Images.list({}, function(err,doc){
				return res.send(handle(err,doc));
			});
		},
		create: function(req,res,next){
			var obj 	= req.body
				, path 	= require('path')
			if (obj._csrf) delete obj._csrf;
			var tmp = new db.Images(obj.fileName);			
			fs.readFile(req.files.fileName.path, function(err, data){
				if (err)
					return res.send(500, err);
				var ext = path.extname(req.files.fileName.name||'').split('.');
					ext = ext[ext.length - 1];
				tmp.hashName 	= tmp._id + '.' + ext;
				tmp.fileName 	= req.files.fileName.name;
				tmp.mimeType	= req.files.fileName.type;
				tmp.client		= req.session.passport.user;

				validateFolder(global.root + "public/images/products/" + tmp.client, function() {
					var newPath		= global.root + "public/images/products/" + tmp.client + '/' + tmp.hashName;
					fs.writeFile(newPath, data, function(err){
						if (err)
							return res.send(handle(err,null))
						tmp.save(function(err,doc){
							if(err)
								return res.send(handle(err,null));
							var obj = 	{ id:doc._id }
							return res.send(obj);
						});
					});
				});				
			});
		},
		delete: function(req,res,next){
			// var id = req.image.id;
			// db.Articles.find({$or: [{ 'preview.content.hashName': req.image.hashName}, { 'content.content.hashName': req.image.hashName}]}, function(err,doc){
			// 	if (doc.length > 0)
			// 		res.send(handle(err,{error:0, message: 'simulated removing file'}))
			// 	else
			// 		db.Images.delete({_id:id}, function(err,doc){
			// 			fs.unlinkSync(global.root + "public/images/imgs/"+req.image.hashName);
			// 			return res.send(handle(err,{error:0, message: 'actually removed file'}));
			// 		})
			// })
		}
	}
}

function validateFolder(path, next) {
	fs.exists(path, function(exists){
		if(!exists) {
			fs.mkdir(path, function(error) { 
				next();
			});
		} else {
			next();
		}
	});
}