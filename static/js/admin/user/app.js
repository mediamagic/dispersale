'use strict'; 
angular.module('admin.user', ['ngResource','ngCookies', 'ui', 'ui.bootstrap']).
config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$routeProvider.
		when('/main', {templateUrl: '/views/admin/user/Main.html', controller: MainCtrl, name:'Main'}).		
		when('/sales', {templateUrl: '/views/admin/user/Sales.html', controller: SalesCtrl, name:'Sales'}).
    when('/incentives', {templateUrl: '/views/admin/user/Incentives.html', controller: IncentivesCtrl, name:'Incentives'}).
		otherwise({redirectTo: '/main'});
}])
.filter('status', function() {
	return function(status) { 		
		if(status) 
			return 'enabled'
		
		return 'disabled';
	}
})
.filter('saleStatus', function() {
  return function(sale) {   
    
    return sale.status == 1 ? 'Closed' : sale.status == 2 ? 'Pending' : sale.status == 3 ? 'Canceld' : sale.status;
  }
})
.filter('incentiveStatus', function() {
  return function(incentive) {   
    
    return incentive.status == 1 ? 'Not Paid' : incentive.status == 2 ? 'Paid' : incentive.status;
  }
})
.filter('buildImagePath', function() {
  return function(items) {   
  	var newItems = [];
  	
  	for(var i = 0; i < items.length; i++) {
  		newItems.push(items[i]);
  		newItems[i].image = 'http://node.mediamagic.co.il:50050/resources/images/' + items[i].share.image;  		
  	}

    return newItems;
  }
})
.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
})