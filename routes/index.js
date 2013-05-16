var fs = require('fs')
/*
*	Page Routing
*/

exports.index = function(req, res){
	res.render('layout', { title: 'loading', random:Math.floor(Math.random() * 9999999999)});
}

exports.views = function(req, res){
	var file = 'views/partials/'+req.params.view+'.jade';
	fs.exists(file, function(exists){
		exists ? res.render('partials/'+req.params.view) : res.send(404);
	});
}