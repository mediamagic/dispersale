var fs = require('fs')
/*
*	Page Routing
*/

exports.index = function(req, res, next){
	res.render('admin.client.jade', {title: 'loading'});
}

exports.logout = function(req,res,next){
	req.session.user_id = null;
	delete req.session.user_id;
	res.redirect('/');
}

exports.views = function(req, res, next){
	var file = 'views/partials/admin/client/'+req.params.view+'.jade';
	fs.exists(file, function(exists){
		exists ? res.render('partials/admin/client/'+req.params.view) : res.send(404);
	});
}