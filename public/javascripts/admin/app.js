'use strict'; 
angular.module('admin', ['ngResource','ngCookies', 'ui', 'ui.bootstrap']).
config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$routeProvider.
		when('/main', {templateUrl: '/views/admin/Main.html', controller: MainCtrl, name:'Main'}).
		when('/items', {templateUrl: '/views/admin/Items.html', controller: ItemsCtrl, name:'Items'}).
		when('/item', {templateUrl: '/views/admin/Item.html', controller: ItemCtrl, name:'Item'}).
		when('/item/:id', {templateUrl: '/views/admin/Item.html', controller: ItemCtrl, name:'Item'}).
		when('/sales', {templateUrl: '/views/admin/Sales.html', controller: SalesCtrl, name:'Sales'}).
		otherwise({redirectTo: '/main'});
}])
.filter('status', function() {
	return function(status) { 		
		if(status) 
			return 'enabled'
		
		return 'disabled';
	}
})
.filter('itemStatus', function() {
  return function(item) {    
    return item.status == 1 ? 'active' : item.status == 2 ? 'pending' : item.status == 3 ? 'disabled' : item.status == 4 ? 'inactive' : item.status;
  }
})
.filter('itemCommisionAndTax', function() {
  return function(item) {    
    var taxfree = ((item.incentive * this.settings.commision ) / 100) + item.incentive;
	return Math.floor((((taxfree * this.settings.tax ) / 100) + taxfree) * 100) / 100;
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