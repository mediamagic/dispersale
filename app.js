var express = require('express')
  , routes  =  {
                  regular:require('./routes'),
                  admin: {
                    client: require('./routes/admin.client'),
                    user:require('./routes/admin.user')
                  } 
                }
  , http    = require('http')
  , path    = require('path')
  , pass    = require('passport')
  , LocalS  = require('passport-local').Strategy
  , FacebookS  = require('passport-facebook').Strategy
  , mcache  = require('connect-memcached')(express)
  , app     = express()
  , assetMgr= require('connect-assetmanager')
  , url     = require('url');
  global.root = process.cwd() + '/'

//ASSET MANAGEMENT
var assetManagerGroups = {
  'js': { 'route': /\/javascripts\/app\.min\.js/
        , 'path': './static/js/'
        , 'dataType': 'javascript'
        , 'files': [ 'app.js', 'controllers.js'] },
  'admin.client':{ 'route': /\/javascripts\/app\.admin\.client\.min\.js/
        , 'path': './static/js/admin/client/'
        , 'dataType': 'javascript'
        , 'files': [ 'app.js', 'controllers.js'] },
  'admin.user':{ 'route': /\/javascripts\/app\.admin\.user\.min\.js/
        , 'path': './static/js/admin/user/'
        , 'dataType': 'javascript'
        , 'files': [ 'app.js', 'controllers.js'] } 
}

var assetMiddleWare = assetMgr(assetManagerGroups);

//GENERAL CONFIGURATION
app.configure(function(){
  app.set('port', process.env.PORT || 50050)
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')    
  app.use(express.compress())
  app.use(express.favicon(__dirname + '/public/favicon.ico'))
  app.use(express.cookieParser()); 
  app.use(express.session(  { secret: "U^Z;$,^j6DZj<GGd"
                            , store: new mcache
                            , cookies:  { secure: false
                                        , maxAge: 86400000 } }))
  app.use(express.bodyParser({ keepExtensions: true}))
  app.use(express.methodOverride())
  app.use(express.csrf())
  app.use(function(req, res, next){
    var token = req.session._csrf
    , cookie  = req.cookies['csrf.token']
    , port    = (app.get('port') == 80 || app.get('port') ==443) ? '' : ':'+app.get('port')
    if (token && cookie !== token)
      res.cookie('csrf.token', token)
    res.locals.requested_url = req.protocol + '://' + req.host + req.path
    next()
  })
  app.use(pass.initialize())
  app.use(pass.session())  
  app.use(app.router)  
});

app.configure('development', function(){
  app.use(express.logger('dev'))
  app.use(express.errorHandler())  
  app.use(assetMiddleWare);
  app.use(require('less-middleware')( { src: __dirname + '/public'
                                      , compress: true
                                      , optimization: 2 }))
  app.use(express.static(path.join(__dirname, 'public')))
   console.log('development mode')
});

app.configure('production', function(){
  var live = 86400000
  app.use(express.static(path.join(__dirname, 'public'), {maxAge: live}))
  console.log('production mode')
});

//MIDDLEWARE
function ensureAuthenticated(req, res, next){    
  if (req.isAuthenticated()) return next() 

  if(req.route.path.indexOf('client') > -1) {    
    res.redirect('/#/login/client');
  } else if(req.route.path.indexOf('user') > -1) {
    res.redirect('/#/login/user')
  }
}

function ensureLevel(level){    
  return function(req, res, next) {
    if(req.user[0].level == level)
      return next();
    req.logout();

    if(level == 1)
      return res.redirect('/#/login/user');

    if(level == 2)
      return res.redirect('/#/login/client');    
  }
}

//load db async
require('./models')(function(resp){
  var Settings      = require('./controllers/settings')(resp)
      , Stats       = require('./controllers/statistics')(resp)
      , PowerUsers  = require('./controllers/powerUsers')(resp)
      , Api         = require('./controllers/api')(resp)
      , Images      = require('./controllers/images')(resp)
      , Items       = require('./controllers/items')(resp)
      , Sales       = require('./controllers/sales')(resp) 
      , Incentives  = require('./controllers/incentives')(resp) 
      , Domain      = require('./controllers/domain')(resp)
      , Dispersale  = require('./controllers/dispersale')(resp)
      , Tokens      = require('./controllers/tokens')(resp)
      , Facebook    = require('./controllers/facebook')(resp)

  pass.use(new LocalS(
    function(username, password, done){
      resp.powerUsers.find({username:username}, function(err,doc){
        if(err)
          return done(err)
        if (doc.length < 1)
          return done(null,false)
        doc[0].comparePassword(password, function(err,resp){
          if (err)
            return done(err)
          if (resp)
            return done(null, doc[0])
        })
      })
    }
  ))

  // pass.use(new FacebookS({
  //     clientID: '188191534668323',
  //     clientSecret: 'e73cc1e7a9f2764cb180e57115e2b067',
  //     callbackURL: "http://node.mediamagic.co.il:50050/facebook/callback",
  //     passReqToCallback: true
  //   },
  //   function(accessToken, refreshToken, profile, done) {
  //     console.log(accessToken)
  //     console.log(refreshToken)
  //     console.log(profile)
  //     // User.findOrCreate(..., function(err, user) {
  //     //   if (err) { return done(err); }
  //     //   done(null, user);
  //     // });
  //   done(null, null);
  //   }
  // ));

  // app.get ('/facebook/callback', function(req, res, next) {
  //   console.log('FACEBOOK CALLBACK!!!!!')
  //   res.send(200);
  // })

  //app.get('/api/login/facebook', pass.authenticate('facebook'));

  pass.serializeUser(function(user,done){
    return done(null,user._id)
  })

  pass.deserializeUser(function(id,done){
    if (!id)
      return done(null,false)
    resp.powerUsers.find({_id: id}, function(err, resp){
      return done(null,resp)
    })
  })

  //VIEWS
  app.get ('/', routes.regular.index)
  app.get ('/views/:view.html', routes.regular.views)
  app.get ('/views/admin/client/:view.html', ensureAuthenticated, ensureLevel(2), routes.admin.client.views)
  app.get ('/admin/client*', ensureAuthenticated, ensureLevel(2), routes.admin.client.index)
  app.get ('/views/admin/user/:view.html', ensureAuthenticated, ensureLevel(1), routes.admin.user.views)
  app.get ('/admin/user*', ensureAuthenticated, ensureLevel(1),routes.admin.user.index)
  app.get ('/logout', function(req,res){
    req.logout()
    res.redirect('/')
  })

  //API
  app.post('/api/login', pass.authenticate('local'), function(req,res) {  	
    if (req.user) {
      res.json({error:0})
    }
    else res.send(401)
  })

  app.post('/api/login/user', function(req,res) {    
    resp.powerUsers.findOne({'facebook.id':req.body.uid}, function(err, user) {
      if(err)
        return res.send({ error:1, message:err});

      if(user) {
        req.session.passport.user = user._id;
        req.user = user;      

        return res.send(user);
      } else {
        return res.send({ error:1, message:'user not found'});
      }
    });    
  });

  app.get ('/api/uploads/images', ensureAuthenticated, Images.index);
  app.post('/api/uploads/images', ensureAuthenticated, Images.create);

  app.get('/resources/settings', Settings.index);
  app.get('/resources/items', ensureAuthenticated, Items.index);
  app.get('/resources/items/:id', ensureAuthenticated, Items.load, Items.show);
  app.post('/resources/items', ensureAuthenticated, Items.create);
  app.put('/resources/items/:id', ensureAuthenticated, Items.load, Items.update);
  app.get('/resources/sales', ensureAuthenticated, Sales.index);
  app.put('/resources/sales/:id', Sales.load, Sales.update); // i dont user ensureAuthenticated couse when a user is updating sale status to allow posts he is not logged in, need to create new route in the future
  app.post('/resources/sales/:id/close', ensureAuthenticated, Sales.close);
  app.get('/resources/incentives', ensureAuthenticated, Incentives.index);

  // Dispersale JS
  app.get('/resources/dispersale-latest.js', Domain.validate, Dispersale.loadJS);

  app.get('/getItemByIdentifier', Domain.validate, function(req, res, next) {

    var client = Tokens.decode(req.query.key);

    if(req.query.identifier && client) {
      resp.Items.findOne({ identifier:req.query.identifier, client:client}, function(err, item) {
        if(err)
          return res.send({error:1, message:err});

        if(item) {
          return res.send({error:0, item:item._id});
        } else {
          return res.send({error:1, message:'item not found'});
        }
      });
    } else {
      return res.send({ error:1, message:'not identifer sent'})
    }

  });

  //TEMP!!! REMOVE
  app.get('/genClient/:id', function(req, res, next) {
    res.send(new Buffer(JSON.stringify(req.params.id)).toString('base64'));
  });
  app.get('/genSale/:id', function(req, res, next) {
    res.send(new Buffer(JSON.stringify(req.params.id)).toString('base64'));
  });
  //

  //FACEBOOK
  // app.post('/graph/facebook/:id/:type', function(req, res, next) {
  //   var data = req.body;
  //   var type = req.params.type;
  //   var uid = req.params.id;
  //   var access_token = req.query.access_token;
    
  //   Facebook.graph[type].post(uid, access_token, data, function(err, resp, body) {      
  //     body = JSON.parse(body);

  //     if (!err && resp.statusCode == 200) {
  //       res.send(body);
  //     } else if(resp.statusCode == 400) {
  //       if(body.error && body.error.code == 190 && body.error.error_subcode == 463) {
  //         //todo: token expired, mark it somewhere and when the user login next time, request for new token and make the feed post again
  //         res.send(body);
  //       }
  //     }
  //   });
  // });

  app.get('/resources/facebook/users/:id', PowerUsers.facebook.load, PowerUsers.facebook.show);
  app.post('/resources/facebook/users', PowerUsers.facebook.create);
  //

  app.get('/resources/users/:id', ensureAuthenticated, function(req, res, next) {
    
    var id = req.params.id == 'me' ? req.session.passport.user : req.params.id;

    resp.powerUsers.findOne({ _id:id}, {}, {}, function(err, doc) {
      return res.send(doc);
    });
  });

  // var allowedDomains = [];
  // resp.powerUsers.find({}, function(err, users){
  //   for(var user = 0; user < users.length; user++) {
  //     if(users[user].allowedDomains) {        
  //        for(var domain = 0; domain < users[user].allowedDomains.length; domain++) {          
  //          allowedDomains.push(users[user].allowedDomains[domain]);
  //        }
  //     }
  //   }    
  // });

  // function validateDomain(req, res, next){
  //   var referer = req.header.referer;

  //   if(!referer)
  //     return res.send(401);

  //   tldextract(req.headers.referer, function (err, obj) {
  //     var domain = obj.domain + '.' + obj.tld;
  //     var allowed = false;

  //     if(allowedDomains.indexOf(domain) > -1) {        
  //       res.header('Access-Control-Allow-Origin', req.headers.origin);

  //       next()
  //     } else {
  //       res.send(401);
  //     }
  //   });
  // }

  app.get('/resources/images/:id', Images.load, Images.show);

  app.get('/iframeBuilder/:item/:sale', Domain.validate, function(req, res, next) {

    var item = req.params.item;
    var sale = req.params.sale;

    resp.Items.findOne({_id:item}, {}, {}, function(err, doc) {        
      var data = {
        sale:sale,
        share: {
          title:doc.share.title,
          description: doc.share.description,
          image:'http://node.mediamagic.co.il:50050/resources/images/' + doc.share.image
        }        
      }      
      res.render('./iframeBuilder', data);
    });
    
  });  

  app.options('/saleReport', Domain.validate, function(req, res, next) { 
    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token');
    res.send(200); 
  });
  app.post('/saleReport', Domain.validate, Sales.client.create);

  app.get('/validateItemAndClient', Domain.validate, function(req, res, next) {

    if(req.query.key) {
      if(req.query.item) {
        validateItemAndClient({item:req.query.item, key:req.query.key}, function(response) {        
            return res.send({error:response.error, message:response.message});;        
        }); 
      } else {
        return res.send({error:'no item in query'});
      }
    } else {
      return res.send({error:'no key in query'});
    }

  });

  function validateItemAndClient(data, next) {

    var clientId = Tokens.decode(data.key);

    resp.Items.findOne({_id:data.item}, {}, {}, function(err, item) {
        if(err)           
          return next({ error:err, message:'item is not valid?'});
                
        if(item && clientId) {

          if(item.client != clientId)             
            return next({ error:1, message:'item not match to client' })          

          if(item.status == 1) {

            resp.powerUsers.findOne({ _id:item.client}, {}, {}, function(err, client) {
              if(err)
                return next({ error:err, message:'client is not valid?'});

              if(client) {
                
                if(client.status == 1) {
                  return next({error:0});
                } else {
                  return next({ error:1, message:'client status is ' + client.status })
                }

              } else {
                return next({ error:1, message:'client not found' })
              }

            });

          } else {
            return next({ error:1, message:'item status is ' + item.status })
          }
        } else {
          return next({ error:1, message:'item not found' })
        }
      });
  } 

  app.get('/shop/:saleEncoded', function(req, res, next) {
    var saleId = null;

    try {
      saleId = Tokens.decode(req.params.saleEncoded);
    } catch(e) {}

    if(saleId) {
        resp.Sales.findOne({ _id:saleId}, {}, {}, function(err, doc_sale) {
          if(!doc_sale) 
            return res.redirect('/#/error/' + Tokens.encode({error:1, message:'sale not found'}));

          if(doc_sale.status == 1) {
            var sale = {
              id:saleId,
              item: {
                id:doc_sale.item
              },
              client: {
                id:doc_sale.client
              }
            }

            resp.powerUsers.findOne({ _id:sale.client.id}, {}, {}, function(err, doc_client) {
              if(!doc_client) 
                return res.redirect('/#/error/' + Tokens.encode({error:1, message:'client not found for this sale'}));

              if(doc_client.status == 1) {
                
                sale.client.shopBaseUrl = doc_client.shopBaseUrl;

                resp.Items.findOne({ _id:sale.item.id}, {}, {}, function(err, doc_item) {
                  if(!doc_item) 
                    return res.redirect('/#/error/' + Tokens.encode({error:1, message:'item not found for this sale'}));

                  if(doc_item.status == 1) {

                    sale.item.path = doc_item.path;
                    
                    var encodedToken = Tokens.generate({
                      csrf:req.session._csrf,
                      sale:sale.id,
                      item:sale.item.id,
                      client:sale.client.id,
                      user:req.session.passport.user,
                      action:'redirect',
                      ip:req.connection.remoteAddress,
                      referer:req.headers.referer
                    });
                    
                    if(sale.item.path.indexOf('?') > -1) {
                      sale.item.path += '&drt=' + encodedToken;
                    } else {
                      sale.item.path += '?drt=' + encodedToken;
                    }

                    sale.client.shopBaseUrl += sale.item.path;

                    validateSiteCode(sale.client.shopBaseUrl, 'http://node.mediamagic.co.il:50050/resources/dispersale-latest.js', function(valid) {                      
                      if(valid) {                        
                        return res.redirect(sale.client.shopBaseUrl);
                      } else {                        
                        return res.redirect('/#/error/' + Tokens.encode({error:1, message:'site dont have CDN js in code! (or site is down)'}));
                      }
                    });

                  } else {                    
                    return res.redirect('/#/error/' + Tokens.encode({error:1, message:'failed on item status (' + doc_item.status + ')'}));
                  }

                });

              } else {                
                return res.redirect('/#/error/' + Tokens.encode({error:1, message:'failed on client status (' + doc_client.status + ')'}));
              }
            });
          } else {            
            return res.redirect('/#/error/' + Tokens.encode({error:1, message:'failed on sale status (' + doc_sale.status + ')'}));
          }
        });
    } else {
      return res.redirect('/#/error/' + Tokens.encode({error:1, message:'invalid sale'}));
    }
  });

  app.get('/api/redirect/:sale', function(req, res, next) {
    resp.Sales.findOne({ _id:req.params.sale}, {}, {}, function(err, doc_sale) {
      if(!doc_sale) 
        return res.send(404);

      if(doc_sale.status == 1) {
        var sale = {
          id:req.params.sale,
          item: {
            id:doc_sale.item
          },
          client: {
            id:doc_sale.client
          }
        }

        resp.powerUsers.findOne({ _id:sale.client.id}, {}, {}, function(err, doc_client) {
          if(!doc_client) 
            return res.send(404);

          if(doc_client.status == 1) {
            
            sale.client.shopBaseUrl = doc_client.shopBaseUrl;

            resp.Items.findOne({ _id:sale.item.id}, {}, {}, function(err, doc_item) {
              if(!doc_item) 
                return res.send(404);

              if(doc_item.status == 1) {

                sale.item.path = doc_item.path;
                
                var encodedToken = Tokens.generate({
                  csrf:req.session._csrf,
                  sale:sale.id,
                  item:sale.item.id,
                  client:sale.client.id,
                  user:req.session.passport.user,
                  action:'redirect',
                  ip:req.connection.remoteAddress,
                  referer:req.headers.referer
                });
                
                if(sale.item.path.indexOf('?') > -1) {
                  sale.item.path += '&drt=' + encodedToken;
                } else {
                  sale.item.path += '?drt=' + encodedToken;
                }

                sale.client.shopBaseUrl += sale.item.path;

                validateSiteCode(sale.client.shopBaseUrl, 'http://node.mediamagic.co.il:50050/resources/dispersale-latest.js', function(valid) {
                  if(valid) {
                    res.send({error:0, url:sale.client.shopBaseUrl});
                  } else {
                    return res.send({error:'site dont have CDN js in code! (or site is down)'});
                  }
                });

              } else {
                return res.send({ error:'failed on item status', status:doc_item.status});    
              }

            });

          } else {
            return res.send({ error:'failed on client status', status: doc_client.status});
          }
        });
      } else {
        return res.send({error:'failed on sale status', status:doc_sale.status});
      }
    });
  });

  function validateSiteCode(siteUrl, cdnUrl, next) {

  	var child = require('child_process');
  	var validationProcess = child.fork(__dirname + '/siteCodeValidation.js');

  	validationProcess.on('message', function(res) {
    	next(res);
    	validationProcess.kill();
  	});

  	var childArgs = {
	    siteUrl:siteUrl,
	    cdnUrl:cdnUrl	    
	  };

	  validationProcess.send(childArgs);
  }

	app.get('/createToken', Domain.validate, function(req, res, next) {   
    
    if(req.query.item) {
      if(req.query.key) {        
        validateItemAndClient({item:req.query.item, key:req.query.key}, function(response) {
          if(response.error == 0) {                        
            var encodedToken = Tokens.generate({
              csrf:req.session._csrf,
              sale:null,
              item:req.query.item,
              client:Tokens.decode(req.query.key),
              user:req.session.passport.user,
              action:'create token',
              ip:req.connection.remoteAddress,
              referer:req.headers.referer
            });

            return res.send({error:0, token:encodedToken});
          }
            
          return res.send(response);        
        }); 
      } else {
        return res.send({error:'no key to create token from'});
      }
      
    } else {
      return res.send({error:'no item to create token from'});
    }
    
  });


  // app.get('/getToken', function(req, res, next) {    
  //   tldextract(req.headers.referer, function (err, obj) {
  //     console.log(obj);
  //   });

  //   var urlObject = url.parse(req.headers.referer);
  //   var domain = urlObject.hostname || urlObject.host;
  //   var origin = req.headers.origin;
  //   var referenceId = req.query.dri;

  //   var allowed = false;

  //   if(allowedDomains.indexOf(domain) > -1)
  //     allowed = true;

  //   var token = {
  //     csrf:req.session._csrf,
  //     dri:referenceId
  //   };

  //   var encodedToken = new Buffer(JSON.stringify(token)).toString('base64');
  //   //var decodedToken = JSON.parse(new Buffer(encodedToken, 'base64').toString());

  //   if(allowed) {      
  //     res.header('Access-Control-Allow-Origin', origin);
  //     return res.send(encodedToken);      
  //   } else {
  //     return res.send(401);
  //   }
  // })

  //START APPLICATION PROCESS WORKERS FOR EACH LOGICAL CPU
  var server = http.createServer(app)
  //   , cluster = require('cluster')
  //   , numCPUs = require('os').cpus().length
  //   , i       = 0
  // if (cluster.isMaster) {
  //   for (; i < numCPUs; i++)
  //     cluster.fork()
  //   cluster.on('death', function(worker) {
  //     cluster.fork()
  //   })
  // } else {
    server.listen(app.get('port'), function(){
      console.log("Express server listening on port " + app.get('port'))
    })
  //}
})