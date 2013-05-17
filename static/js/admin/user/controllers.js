angular.module('admin.user.controllers', ['ngResource', 'ngCookies', 'ui', 'ui.bootstrap']);

var GlobalCtrl = ['$scope', '$resource', '$location', '$cookies', '$routeParams', function($scope, $resource,$location,$cookies, $routeParams){

	$scope.cookies = $cookies;
	$scope.resource = $resource;
	$scope.location = $location;
	$scope.route = $routeParams;

	$scope.Items = $scope.resource('/resources/items/:id', {_csrf: $cookies['csrf.token']}, {update: {method:'PUT'}});
	$scope.Sales = $scope.resource('/resources/sales/:id', {_csrf: $cookies['csrf.token']}, {update: {method:'PUT'}});
	$scope.Users = $scope.resource('/resources/users/:id', {_csrf: $cookies['csrf.token']});
	$scope.Incentives = $scope.resource('/resources/incentives', {_csrf: $cookies['csrf.token']});

	$scope.Facebook = {
		graph: $scope.resource('/graph/facebook/:id/:type', {_csrf: $cookies['csrf.token']})		
	}

	$scope.Settings = $scope.resource('/resources/settings');
	$scope.settings = {};

	$scope.Settings.get({}, function(settings)	{ 
		$scope.settings = settings;
		$scope.$broadcast('settings_loaded');		
	});

	$scope.user = {};

	$scope.Users.get({ id:'me'}, function(user) {
		$scope.user = user;		
		$scope.shopBaseUrl = $scope.user.shopBaseUrl;
	});

	$scope.pagination = {
							items: {
								pages:1,
					  			page:1,
								total:10
							},
							sales: {
								pages:1,
					  			page:1,
								total:10
							},
							incentives: {
								pages:1,
					  			page:1,
								total:10	
							}
	}

	$scope.setPage = function (pageName, page) {
		console.log(pageName)
	    $scope.pagination[pageName].page = page;
  	};

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

	$scope.getDateById = function(id) {
	    return new Date(parseInt(id.toString().slice(0,8), 16)*1000);
	}

}];

var MainCtrl = ['$scope', function($scope){	

}];

var SalesCtrl = ['$scope', '$filter', function($scope, $filter){	
	$scope.sales = [];

	$scope.Sales.query({ type:'user'}, function(res) {		
		$scope.sales = $filter('orderBy')(res, '-_id');
	});

	$scope.$watch('sales.length', function(n,o){		
	if (n!=o && n!=undefined)
		$scope.pagination.sales.pages = Math.ceil(n / $scope.pagination.sales.total);		
	}, true);

	$scope.statusChanged = function(elem, sale) {
		var index = elem.selectedIndex;
		
		sale = JSON.parse(sale);

		var flag = confirm('are you sure you want to change the sale status to ' + elem.options[index].text + ' ?');

		if(flag) {			
			$scope.Sales.update({id:sale._id}, { status:(elem.selectedIndex + 1)}, function(res) {		
				var saleIndex = getIndexIfObjWithOwnAttr($scope.sales, '_id', sale._id);
				$scope.sales[saleIndex] = res;

				if((index + 1) == 1) { // if sale status changed to Closed (approved).

					$scope.resource('/resources/sales/:id/close', {_csrf: $scope.cookies['csrf.token']}, {close:{method:'POST'}}).close({id:res._id}, {}, function(res) {
						console.log(res);
					});
					// // check if sale token got token with a sale id in it, if it does it means this sale came from reference and we need to get that sale, take the user id that belong to that sale and give him the incentive
					// if(res.token) {

					// }

					// // check if the user who own that sale approved to publish it, if he does, take his uid and access_token and post it to facebook graph.	
					// if(res.user && res.publish) {
					// 	$scope.Users.get({id:res.user}, function(user) {						
					// 		if(user) {
					// 			$scope.Items.get({id:res.item}, function(item) {								
					// 				if(item) {																					
					// 					$scope.Facebook.graph.save({ type:'feed', id:user.facebook.id, access_token:user.facebook.access_token}, {
					// 						message:'this is dynamic message',
					// 						picture: 'http://node.mediamagic.co.il:50050/resources/images/' + item.share.image,					
					// 						link: 'http://node.mediamagic.co.il:50050/#shop/' + sale._id,
					// 						name:item.share.title,										
					// 						caption:' ',
					// 						description:item.share.description,
					// 						properties:'{ link:"http://node.mediamagic.co.il:50050/#shop/' + sale._id + '"}',
					// 						actions:'[{ name:"Learn about Dispersale", link:"http://www.dispersale.com"}]'
					// 					}, function(fbResponse) {
					// 						console.log(fbResponse);
					// 					});
					// 				}
					// 			});
					// 		}
					// 	});
					// }
				}
				
			});
		} else {			
			elem.selectedIndex = sale.status - 1;
		}
	}

}];

var IncentivesCtrl = ['$scope', '$filter', function($scope, $filter){	
	$scope.incentives = [];

	$scope.Incentives.query({ type:'user'}, function(res) {		
		$scope.incentives = $filter('orderBy')(res, '-_id');
	});

	$scope.$watch('incentives.length', function(n,o){		
	if (n!=o && n!=undefined)
		$scope.pagination.incentives.pages = Math.ceil(n / $scope.pagination.incentives.total);		
	}, true);

}];

var getIndexIfObjWithOwnAttr = function(array, attr, value) {
    for(var i = 0; i < array.length; i++) {
        if(array[i].hasOwnProperty(attr) && array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}