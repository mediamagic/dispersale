'user strict';
angular.module('admin.controllers', ['ngResource', 'ngCookies', 'ui', 'ui.bootstrap']);

var GlobalCtrl = ['$scope', '$resource', '$location', '$cookies', '$routeParams', function($scope, $resource,$location,$cookies, $routeParams){

	$scope.cookies = $cookies;
	$scope.location = $location;
	$scope.route = $routeParams;

	$scope.Items = $resource('/resources/items/:id', {_csrf: $cookies['csrf.token']}, {update: {method:'PUT'}});
	$scope.Sales = $resource('/resources/sales/:id', {_csrf: $cookies['csrf.token']}, {update: {method:'PUT'}});
	$scope.Users = $resource('/resources/users/:id', {_csrf: $cookies['csrf.token']});

	$scope.Settings = $resource('/resources/settings');
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

var ItemsCtrl = ['$scope', function($scope){	
	$scope.items = [];

	$scope.Items.query({}, function(res) {		
		$scope.items = res;
	});


	$scope.statusChanged = function(elem, item) {
		var index = elem.selectedIndex;
		
		item = JSON.parse(item);

		var flag = confirm('are you sure you want to change the item status to ' + elem.options[index].text + ' ?');

		if(flag) {			
			$scope.Items.update({id:item._id}, { status:(elem.selectedIndex + 1)}, function(res) {		
				console.log(res);
			});
		} else {			
			elem.selectedIndex = item.status - 1;
		}
	}

}];

var ItemCtrl = ['$scope', function($scope){	
	
	$scope.id = $scope.route.id;
	$scope.editMode = false;

	$scope.saveUpdateButton = 'Create Item';

	if($scope.id)
		$scope.editMode = true;

	$scope.formValid = false;
	$scope.uploading = false;

	$scope.item = {		
		identifier:null,
		name:null,
		model:null,
		path:null,
		share: {
			title:null,
			description:null,
			image: {
				id:null,
				dataUrl:'/images/product.jpg',
				file:null,
				minetype:null
			}
		},
		incentive: {
			amount:1,
			total:0
		},
		coupon: {
			discount:1,			
			enabled:false
		}
	}

	if($scope.editMode) {
		$scope.saveUpdateButton = 'Update Item';

		$scope.Items.get({id:$scope.id}, function(item) {
			if(item.error) {
				$scope.location.path('/items');
				return;
			}

			$scope.item = item;			
			
			$scope.item.incentive = {
				amount:item.incentive,
				total:0
			}

			$scope.item.share.image = {
				id:item.share.image,
				dataUrl:'http://node.mediamagic.co.il:50050/resources/images/' + item.share.image,
				file:null,
				minetype:null
			}
		});
	}

	$scope.$watch('item', function(n, o) {
		
		$scope.formValid = false;

		if(n.incentive.amount == undefined || n.incentive.amount == 0)
			n.incentive.amount = 1;

		$scope.updateTotalIncentive(n.incentive.amount);

		if(n.identifier && n.identifier.length > 2) {
			if(n.name && n.name.length > 2) {
				if(n.model && n.model.length > 0) {
					if(n.path && n.path.length > 2) {
						if(n.share.title && n.share.title.length > 2) {
							if(n.share.description && n.share.description.length > 10) {
								if(n.share.image.file || $scope.editMode) {
									$scope.formValid = true;
								}
							}
						}
					}
				}
			} 		
		} 		

	}, true);

	$scope.updateTotalIncentive = function(amount) {
		var taxfree = ((amount * $scope.settings.commision ) / 100) + amount;
		$scope.item.incentive.total = Math.floor((((taxfree * $scope.settings.tax ) / 100) + taxfree) * 100) / 100;
	}

	$scope.triggerClick = function(div) {		
		$('#' + div).trigger('click');
	}

	$scope.processImage = function(image) {
		$scope.item.share.image.file = image;		

		var mimeType = /image.*/;				
			if(!image.type.match(mimeType)) 
				return alert('only image type allowed!');

		$scope.safeApply(function() {	
			$scope.uploading = true;
		});

		var reader = new FileReader();
		reader.onload = (function(file) {					
			return function(env){	
				$scope.safeApply(function() {						
					$scope.item.share.image.dataUrl = env.target.result;
					$scope.uploading = false;
				});
			};
		}(image))
		reader.readAsDataURL(image);	
	}

	$scope.uploadImage = function(next) {
		var fd = new FormData();
		fd.append('fileName', $scope.item.share.image.file);
		fd.append('_csrf', $scope.cookies['csrf.token'])
		
		var xhr = new XMLHttpRequest();

		xhr.open("POST", "/api/uploads/images" , true);

		xhr.onload = function(e) {			
			next(JSON.parse(this.response).id);
		}

		xhr.upload.onprogress = function(e) {

		}

		xhr.onerror = function(e) {
			next(null);
		}

		xhr.send(fd);
	}

	$scope.createUpdateItem = function() { 
		if($scope.editMode) {
			$scope.updateItem();
		} else {
			$scope.createItem();
		}
	}

	$scope.updateItem = function() {
		if($scope.item.share.image.file) {
			$scope.uploadImage(function(imageId) {
				if(!imageId)
					return console.log('error: unable to upload image to server');

				$scope.item.share.image = imageId;
				$scope.item.incentive = $scope.item.incentive.amount;

				$scope.Items.update({id:$scope.id}, $scope.item, function(res) {
					window.location.href = '#/items';
				});

			});
		} else {
			$scope.item.share.image = $scope.item.share.image.id;
			$scope.item.incentive = $scope.item.incentive.amount;

			$scope.Items.update({id:$scope.id}, $scope.item, function(res) {
					window.location.href = '#/items';
			});
		}
	}

	$scope.createItem = function() {
		$scope.uploadImage(function(imageId) {
			if(!imageId)
				return console.log('error: unable to upload image to server');

			$scope.item.share.image = imageId;
			$scope.item.incentive = $scope.item.incentive.amount;

			$scope.Items.save({}, $scope.item, function(res) {
				window.location.href = '#/items';
			});
		});
	}

	$scope.$on('settings_loaded', function(){
		$scope.updateTotalIncentive($scope.item.incentive.amount);
	});
}];

var SalesCtrl = ['$scope', function($scope){	
	$scope.sales = [];

	$scope.Sales.query({}, function(res) {		
		$scope.sales = res;
	});

	$scope.statusChanged = function(elem, sale) {
		var index = elem.selectedIndex;
		
		sale = JSON.parse(sale);

		var flag = confirm('are you sure you want to change the sale status to ' + elem.options[index].text + ' ?');

		if(flag) {			
			$scope.Sales.update({id:sale._id}, { status:(elem.selectedIndex + 1)}, function(res) {		
				var saleIndex = getIndexIfObjWithOwnAttr($scope.sales, '_id', sale._id);
				$scope.sales[saleIndex] = res;
			});
		} else {			
			elem.selectedIndex = sale.status - 1;
		}
	}

}];

var getIndexIfObjWithOwnAttr = function(array, attr, value) {
    for(var i = 0; i < array.length; i++) {
        if(array[i].hasOwnProperty(attr) && array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}