module.exports = function(db){
	function handle(err,doc){
		if (err)
			return err;
		return doc;
	}
	return {
		index: function(req,res,next){	
			var type = req.query.type;
			
			if(type == 'client') {
				db.Incentives.list({client:req.session.passport.user}, function(err,doc){
					res.send(handle(err,doc));
				});
			} else if(type == 'user') {
				db.Incentives.list({user:req.session.passport.user}, function(err,doc){
					res.send(handle(err,doc));
				});
			} else {
				res.send(res.send(handle(err,{})))
			}
		}
	}
}