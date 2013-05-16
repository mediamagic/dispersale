module.exports = function(db){
	function handle(err,doc){
		if (err)
			return err;
		return doc;
	}
	return {
		index: function(req,res,next){			
			db.Sales.list({client:req.session.passport.user}, function(err,doc){
				res.send(handle(err,doc));
			});
		},
		load: function(req, res, next) {					
			db.Sales.get({_id:req.params.id}, function(err,doc){							
				if (doc) {
					req.sale = doc;
					next();
				} else {
					res.send({'error' : 'Item Not Found'}, 404);
				}
	  		});
		},
		update: function(req,res,next){			
			var id = req.sale.id			
			, data = req.body;

			db.Sales.edit({_id:id}, data, function(err,doc){
				return res.send(handle(err,doc));
			});
		},
		close: function(req, res, next) {			

			db.Sales.findOne({ _id:req.params.id }, function(err, sale) {
				if(sale) {
					
					// check if sale token got token with a sale id in it, if it does it means this sale came from reference and we need to get that sale, take the user id that belong to that sale and give him the incentive
					if(sale.token) {
						var decodedToken = null;

						try {
							decodedToken = JSON.parse(new Buffer(sale.token, 'base64').toString())	
						} catch(e) {}

						if(decodedToken.sale) {
							db.Sales.findOne({ _id:decodedToken.sale }, function(err, incentive_sale) {
								if(!err && incentive_sale) {									
									db.Incentives.add({ originSale:req.params.id, sale:incentive_sale._id, client:incentive_sale.client, item:incentive_sale.item, user:incentive_sale.user, incentive:incentive_sale.incentive }, function(err,incentive){
										if(err) {
											// todo: report!!!
										}
									});
								}
							});
						}

					}

					// check if the user who own that sale approved to publish it, if he does, take his uid and access_token and post it to facebook graph.	
					if(sale.user && sale.publish) {
						db.powerUsers.findOne({_id:sale.user}, function(err, user) {						
							if(err)
								return res.send({ message:'no user for this sale'}, 200);

							if(user) {
								db.Items.findOne({_id:sale.item}, function(err, item) {								
									if(err)
										return res.send({ message:'no item for this sale'}, 200);

									if(item) {																					
										var Facebook = require('../controllers/facebook')(db);
										
										var post = {
											message:' ',
											picture: 'http://node.mediamagic.co.il:50050/resources/images/' + item.share.image,					
											link: 'http://node.mediamagic.co.il:50050/#shop/' + sale._id,
											name:item.share.title,										
											caption:' ',
											description:item.share.description,
											properties:'{ link:"http://node.mediamagic.co.il:50050/#shop/' + sale._id + '"}',
											actions:'[{ name:"Learn about Dispersale", link:"http://www.dispersale.com"}]'
										}

										Facebook.graph.feed.post(user.facebook.id, user.facebook.access_token, post, function(err, resp, body) {      
									    	body = JSON.parse(body);

											if (!err && resp.statusCode == 200) {
												console.log(body.id);
											} else if(resp.statusCode == 400) {
												if(body.error && body.error.code == 190 && body.error.error_subcode == 463) {
											  		//todo: token expired, mark it somewhere and when the user login next time, request for new token and make the feed post again											  		
												}
											}
									    });
										// $scope.Facebook.graph.save({ type:'feed', id:user.facebook.id, access_token:user.facebook.access_token}, {
										// 	message:'this is dynamic message',
										// 	picture: 'http://node.mediamagic.co.il:50050/resources/images/' + item.share.image,					
										// 	link: 'http://node.mediamagic.co.il:50050/#shop/' + sale._id,
										// 	name:item.share.title,										
										// 	caption:' ',
										// 	description:item.share.description,
										// 	properties:'{ link:"http://node.mediamagic.co.il:50050/#shop/' + sale._id + '"}',
										// 	actions:'[{ name:"Learn about Dispersale", link:"http://www.dispersale.com"}]'
										// }, function(fbResponse) {
										// 	res.send(fbResponse, 200);
										// });
									}
								});
							}
						});
					}

				} else {
					return res.send(404);
				}
			});
		
			res.send(200);
		},
		client: {
			create: function(req,res,next){		
				var decodedToken = null;

				try {
					decodedToken = JSON.parse(new Buffer(req.query.token, 'base64').toString());
				} catch(e) {}

				var token = require('./tokens')(db);
							    		
	    		var data = {
	    			token: req.query.token,
	    			item: decodedToken.item,
	    			transaction:req.body.transaction,
	    			client:null,
	    			incentive: {
	    				amount:null,
	    				total:null
	    			}
	    		};

	    		db.Settings.findOne({},{},{}, function(err, settings) {
	    			db.Items.findOne({_id:data.item},{},{},function(err,item){
						data.client = item.client;
						data.incentive.amount = item.incentive;

						var taxfree = ((data.incentive.amount * settings.commision ) / 100) + data.incentive.amount;
						data.incentive.total = Math.floor((((taxfree * settings.tax ) / 100) + taxfree) * 100) / 100;

						db.Sales.add(data, function(err, sale){

							if(!err && sale && sale._id) {
								item.set({ sales:(item.sales + 1)});
								item.save();
								
								token.report({
									token:req.query.token,
									sale:sale._id,
									item:decodedToken.item,
									client:decodedToken.client,
									user:req.session.passport.user,
									action:'sale report',
									ip:req.connection.remoteAddress,
					              	referer:req.headers.referer
								});
							}

							res.send(handle(err,sale._id));
						});					
					});
	    		});			
			}
		}
	}
}