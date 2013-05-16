angular.module ('application.controllers', [ 'ngResource','ngCookies', 'ui' ] );

var GlobalCtrl= [ '$scope', '$resource', '$location', '$window', '$cookies', '$http', '$routeParams', '$timeout'
					, function ( $scope, $resource, $location, $window, $cookies, $http, $routeParams, $timeout ) {

	$scope.viewLoaded = false;

    $scope.location = $location;
    $scope.resource	= $resource;
    $scope.route = $routeParams;

    $scope.Redirect 		= $scope.resource('/api/redirect/:sale', {_csrf: $cookies['csrf.token']});
    $scope.Login 			= $scope.resource( '/api/login', {}, {login: {method: 'post', headers: {"X-CSRF-Token": $cookies['csrf.token']}}} );
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

	$scope.buttons = {
		facebook: {
			text:'',
			show:false
		}
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

	$scope.changeFacebookButton = function(text, show) {		
		$scope.safeApply(function() {	
			$scope.buttons.facebook.text = text;
	    	$scope.buttons.facebook.show = show;
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
	$scope.loginSubmit = function (){	
		$window.location.href = '/api/login/facebook';	
	}

	
}];