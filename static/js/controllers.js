angular.module ('application.controllers', [ 'ngResource','ngCookies', 'ui' ] );

var GlobalCtrl= [ '$scope', '$resource', '$location', '$window', '$cookies', '$http', '$routeParams', '$timeout'
					, function ( $scope, $resource, $location, $window, $cookies, $http, $routeParams, $timeout ) {

	$scope.viewLoaded = false;

    $scope.location = $location;
    $scope.resource	= $resource;
    $scope.route = $routeParams;

    $scope.Redirect 		= $scope.resource('/api/redirect/:sale', {_csrf: $cookies['csrf.token']});
    $scope.Login 			= {
    							client: $scope.resource( '/api/login', {}, {login: {method: 'post', headers: {"X-CSRF-Token": $cookies['csrf.token']}}}),
    							user:$scope.resource( '/api/login/user', {}, {login: {method: 'post', headers: {"X-CSRF-Token": $cookies['csrf.token']}}}),
    						  }
    $scope.Sales 			= $resource('/resources/sales/:id', {_csrf: $cookies['csrf.token']}, {update: {method:'PUT'}});    

    $scope.Facebook = {
    	Users: $scope.resource('/resources/facebook/users/:id', {_csrf: $cookies['csrf.token']})
    }

    $scope.safeApply = function(fn) {
	  var phase = this.$root.$$phase;	  
	  if(phase == '$apply' || phase == '$digest') {
	    if(fn && (typeof(fn) === 'function')) {
	      fn();
	    }
	  } else {
	    this.$apply(fn);
	  }
	};
	
	$scope.fbInitialized = function() {		
		if($scope.viewLoaded) {
			$scope.$broadcast('FB_INITIALIZED');
		} else {
			$timeout($scope.fbInitialized, 100);
		}
	}
	fbInitialized = $scope.fbInitialized;

	$scope.$on('$viewContentLoaded', function() {
	    $scope.viewLoaded = true;
	});

	$scope.buttons = {
		facebook: {
			text:'',
			show:false
		}
	}

	$scope.changeFacebookButton = function(text, show) {		
		$scope.safeApply(function() {	
			$scope.buttons.facebook.text = text;
	    	$scope.buttons.facebook.show = show;
		});		
	}
}];

var fbInitialized = null;

var MainCtrl = ['$scope', function ( $scope ) {
}];

var RedirectCtrl = ['$scope', function ( $scope ) {	
	
	$scope.seconds = 3;
	$scope.sentence = 'processing data...';

	$scope.link = {
		url:'',
		show:false
	}

	if($scope.route.sale) {
	
		$scope.Redirect.get({sale:$scope.route.sale}, function(res) {

			if(res.error == 0) {

				$scope.safeApply(function() {
					$scope.sentence = 'redirecting to the shop in ' + $scope.seconds + ' seconds.';
				});

				var interval = setInterval(function() { 

					$scope.safeApply(function() {
						$scope.seconds--;
						$scope.sentence = 'redirecting to the shop in ' + $scope.seconds + ' seconds.';
					});

					if($scope.seconds == 0) {
						clearInterval(interval);

						// try {
						// 	window.location.href = res.url;
						// } catch(e) {}

						$scope.safeApply(function() {
							$scope.link.url = res.url;
							$scope.link.show = true;
						});
					}
					
				}, 1000);
			} else {
				$scope.safeApply(function() {
					if(res.status) {						
						$scope.sentence = res.error + ' (' + res.status + ')';
					} else {
						$scope.sentence = res.error;
					}
				});
			}

		});

	}

}];

var UserLoginCtrl = ['$scope', function ( $scope ) {

	$scope.sale = {
		id:$scope.route.sale,
		item:$scope.route.item,
		key:$scope.route.key,
		token:$scope.route.token,
		updated:false
	}

	$scope.$on('FB_INITIALIZED', function() {

		FB.getLoginStatus(function(response) {				
		  if (response.status === 'connected') {
		    // the user is logged in and has authenticated your
		    // app, and response.authResponse supplies
		    // the user's ID, a valid access token, a signed
		    // request, and the time the access token 
		    // and signed request each expire
		    var uid = response.authResponse.userID;
		    var accessToken = response.authResponse.accessToken;	    

		    $scope.updateSale($scope.sale, uid, function(res) {
		    	$scope.changeFacebookButton('Share Purchase On Facebook', true);
		    });		    

		  } else if (response.status === 'not_authorized') {
		    // the user is logged in to Facebook, 
		    // but has not authenticated your app
		    $scope.changeFacebookButton('Create Account With Facebook', true);
		  } else {
		    // the user isn't logged in to Facebook.
		    $scope.changeFacebookButton('Login To Facebook', true);
		  }
		 });
	});

	$scope.updateSale = function(sale, uid, next) {
		//todo: go to server, find sale by sale.id, match item id in db sale with the sale.item, save the user _id as the sale owner and finaly report token with 'sale closure' action and update the details
		$scope.Facebook.Users.get({ id:uid}, function(user) {
			if(user) {
				$scope.Sales.update({id:sale.id}, { user:user._id}, function(res) {
					if(res)		
						$scope.sale.updated = true;
					next(res);
				});
			}
		});
	}

	$scope.facebookConnect = function() {
		 
		FB.login(function(response) {
			console.log(response)
						
			if (response.authResponse) {		     
				console.log('we got response.authResponse');
				var access_token = response.authResponse.accessToken;
				console.log('saving token in var and calling FB.api me');
				FB.api('/me', function(response) {			 	
					console.log('we got response from FB.api me');
					console.log(response);
					response.access_token = access_token;
					console.log('saving user to DB');
					$scope.Facebook.Users.save({}, response, function(user) {						
						if($scope.sale.updated) {
							console.log('user saved')
							$scope.Sales.update({id:$scope.sale.id}, { publish:true}, function(res) {
								console.log('sale was updated, user allowed to post when sale is approved (Closed)')
								$scope.changeFacebookButton('Share Purchase On Facebook', false);
							});
						} else {							
							$scope.updateSale($scope.sale, response.id, function(res) {
						    	$scope.changeFacebookButton('Share Purchase On Facebook', true);
						    });									
						}
					});
				});
			} else {
				console.log('User cancelled login or did not fully authorize.');
			}
		}, {scope: 'email,publish_actions'});				
	}

}];

var LoginClientCtrl = ['$scope', '$window', '$http', '$cookies' , function ( $scope, $window, $http, $cookies ){
	console.log('?')
	var prevUrl = $scope.location.$$search.url;
	$scope.loginSubmit = function (){		
		$http.post('/api/login', { username: $scope.username, password: $scope.password }, {headers: {"X-CSRF-Token": $cookies['csrf.token']} })
		.success(function ( data, status, headers, config ) {			
			$window.location.href = '/admin/client';
			return false;
		})
		.error(function (data, status, headers, config) {
			$window.alert('סיסמא שגויה, נא נסה/י שנית')
			return false;
		});
	}
}];

var LoginUserCtrl = ['$scope', '$window', '$http', '$cookies' , function ( $scope, $window, $http, $cookies ){	
	// $scope.loginSubmit = function (){	
	// 	$window.location.href = '/api/login/facebook';	
	// }
	$scope.$on('FB_INITIALIZED', function() {

		FB.getLoginStatus(function(response) {				
		  if (response.status === 'connected') {		    
		    $scope.changeFacebookButton('Login With Facebook', true);	    	    
		  } else if (response.status === 'not_authorized') {
		    $scope.changeFacebookButton('Create Account With Facebook', true);
		  } else {		    
		    $scope.changeFacebookButton('Login To Facebook', true);
		  }
		 });
	});

	$scope.facebookConnect = function() {
		 
		FB.login(function(response) {
									
			if (response.authResponse) {		     
				
				var access_token = response.authResponse.accessToken;
				
				FB.api('/me', function(response) {			 	
					
					response.access_token = access_token;					
					
					$scope.Facebook.Users.save({}, response, function(user) {																		
						$scope.Login.user.login({ uid:response.id}, function(res) {
							if(!res.error && res._id) {
								window.location.href = '/admin/user';
							}
						})					
					});
				});
			} else {
				console.log('User cancelled login or did not fully authorize.');
			}
		}, {scope: 'email,publish_actions'});				
	}

}];

var ErrorCtrl = ['$scope', function ( $scope ) {

	$scope.error = JSON.parse(Base64.decode($scope.route.error));

}];

var Base64 = {
 
  // private property
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
  // public method for encoding
  encode : function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
 
    input = Base64._utf8_encode(input);
 
    while (i < input.length) {
 
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
 
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
 
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
 
      output = output +
      this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
      this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
    }
 
    return output;
  },
 
  // public method for decoding
  decode : function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
 
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
    while (i < input.length) {
 
      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));
 
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
 
      output = output + String.fromCharCode(chr1);
 
      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }
 
    }
 
    output = Base64._utf8_decode(output);
 
    return output;
 
  },
 
  // private method for UTF-8 encoding
  _utf8_encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";
 
    for (var n = 0; n < string.length; n++) {
 
      var c = string.charCodeAt(n);
 
      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
 
    }
 
    return utftext;
  },
 
  // private method for UTF-8 decoding
  _utf8_decode : function (utftext) {
    var string = "";
    var i = 0;
    var c = 0;
    var c1 = 0;
    var c2 = 0;
 
    while ( i < utftext.length ) {
 
      c = utftext.charCodeAt(i);
 
      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      }
      else if((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i+1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      }
      else {
        c2 = utftext.charCodeAt(i+1);
        c3 = utftext.charCodeAt(i+2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }
 
    }
 
    return string;
  }
 
}