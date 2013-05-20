'use strict'; 

angular.module('application', ['ngResource','ngCookies', 'ui'])
.config(['$routeProvider', '$locationProvider' , function($routeProvider, $locationProvider) {
	$routeProvider
		.when('/main',  { templateUrl: '/views/Main.html' , controller: MainCtrl, name:'Main' })
		.when('/shop/:sale',  { templateUrl: '/views/Redirect.html' , controller: RedirectCtrl, name:'Redirect' })
		.when('/userlogin',  { templateUrl: '/views/UserLogin.html' , controller: UserLoginCtrl, name:'UserLogin' })
		.when('/userlogin/:item/:sale',  { templateUrl: '/views/UserLogin.html' , controller: UserLoginCtrl, name:'UserLogin' })
		.when('/login/client', { templateUrl: '/views/LoginClient.html' , controller: LoginClientCtrl, name: 'Login Client' })
		.when('/login/user', { templateUrl: '/views/LoginUser.html' , controller: LoginUserCtrl, name: 'Login User' })
		.when('/error/:error', {templateUrl: '/views/Error.html', controller: ErrorCtrl, name:'Error'})
		.otherwise(     { redirectTo: '/main' })
}])