(function(window) {

  var host = window.location.protocol + '//' + '**SERVER_HOST**';
  var key = '**KEY**';

  if(!key || key == '') {
    console.log('no dispersale key');
    return;
  }

	if(typeof($) == 'undefined') {
	  loadScript("//ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function () {
	  	loadCode();
    });
	} else {
	  loadCode();
	}

	//window.onload = function() {
	var sale = {};

	var loadCode = function() {
		var referer = window.location.href;		
		var wrapper = document.getElementById('dispersale_wrapper'); 

    if(!wrapper) {
      wrapper = document.createElement('div');
      wrapper.setAttribute('id', 'dispersale_wrapper');
      document.body.appendChild(wrapper);
    }

    sale = {
			item: {
				id:wrapper.getAttribute('item')
			},
			transaction: {
				id:wrapper.getAttribute('transaction')
			},
			page: {
				success: wrapper.getAttribute('role') == 'success' ? true : false,
        product: wrapper.getAttribute('role') == 'product' ? true : false
			},
			token: {
        encoded:getFromReferer(referer, 'drt'),
        decoded: null
      }
		}

    if(sale.page.product && !sale.page.success) { // user on sale page

      if(sale.token.encoded) { // user came from viral link and he got a token 

      	var showDispersaleBanner = true;

        if(!isOnPage(sale.item.id)) {
          console.log('error: no item id (ERROR PAGE)');
          return;
        }
       
        sale.token.decoded = JSON.parse(Base64.decode(sale.token.encoded));          
        //sale.reference.id = sale.token.decoded.dri; // if user came from viral link he must have a refrence id inside the token so we save it       

        if(sale.item.id != sale.token.decoded.item) {
          console.log('error: token item id not equal to page item id');
          return; // if item on page in mot eqale to item in token, error page. (client has made a mistake, rather he gave a wrong product page url or item on page was invalid)
        }
				
        //validateItemAndClient('http://node.mediamagic.co.il:50050/validateItemAndClient', {item:sale.item.id, key:key}, function(res) { // making sure the item status is active and the client status is active        	        
        server.get('/validateItemAndClient', { item:sale.item.id }, function(err, res) {
          if(err)
            return console.log(err);

        	if(res.error == '0') {
        		setCookie(sale.token.encoded, Cookie);        
        		wrapper.innerHTML = 'buy this product and give your friend incentive!!! (<a href="#">read more</a>)';        
        	} else {
            console.log(res.error);
        		return;
        	}
        });

      } else { // user probebly came to the page by him self and he doesnt have token, we need to create new one for him
        
        if(!isOnPage(sale.item.id)) { // no item id in page, doing nothing and letting the user go on in the site
          
          console.log('soft error: no item id');

        } else { // item id exists, creating token in server side and saving it in cookie for later use in success page
          
          //TODO: beafore sending the token back, check if item id and cliet id status is valid (1)
          //getTokenFromServer('http://node.mediamagic.co.il:50050/createToken?di=', sale.item.id, new XMLHttpRequest(), function(res) {          	
          //getTokenFromServer('http://node.mediamagic.co.il:50050/createToken', {di:sale.item.id, key:key}, function(res) {
          server.get('/createToken', { item:sale.item.id }, function(err, res) { // getting token from server
            if(err)
              return console.log(err);

            if(res.error == '0') {
              sale.token.encoded = res.token;
              setCookie(sale.token.encoded, Cookie);        
              wrapper.innerHTML = 'buy this product and give your friend incentive!!! (<a href="#">read more</a>)';
            } else {
              console.log('error: could not get token from server');
              console.log(res);
            }
          });

        }
      }

    } else if(sale.page.success && !sale.page.product) { // user on success page
      
      if(isOnPage(sale.item.id)) {

        if(isOnPage(sale.transaction.id)) {

          sale.token.encoded = getCookie(Cookie);
          sale.token.decoded = null;

          var showDispersalePromosionBanner = true;

          if(sale.token.encoded && sale.token.encoded != -1) {               
            sale.token.decoded = JSON.parse(Base64.decode(sale.token.encoded));            
          } else {
            console.log('soft error: report to server that cookie is not present for this success sale!');
          }

          if(sale.token.decoded && sale.token.decoded.item != sale.item.id) {            
              showDispersalePromosionBanner = false;
              console.log('soft error: item id and cookie item id is not equal on success page, not showing share button');            
          }

          if(showDispersalePromosionBanner) {


          	//reportSale('http://node.mediamagic.co.il:50050/saleReport', {token: sale.token.encoded, transaction:sale.transaction.id}, function(res) {
            server.post('/saleReport', {transaction:sale.transaction.id}, function(err, res) {
              if(err)
                return console.log(err);

			      	var saleId = res;

	            var iframe = $('<iframe />');
	            var style = {
	            	width:'200px',
	            	height:'150px'
	            }
	            var attrs = {
	            	width:200,
	            	height:150,
	            	//src: host + '/iframeBuilder/' + sale.item.id + '/' + saleId + '?key=' + key + '&token=' + sale.token.encoded,
                src: host + '/#/userlogin/' + sale.item.id + '/' + saleId + '?key=' + key + '&token=' + sale.token.encoded,
	            	frameborder:0
	            }
	            iframe.attr(attrs);
	            iframe.css(style);
	            $(wrapper).append(iframe);
			      });
          }

        } else {
          console.log('soft error: no transaction id');
        }

      } else {
        console.log('soft error: no item id');
      }

    } else { // user on diferent unintresing page
      console.log('this is inner page');
    }
    
    //TEMP - test for goal
    $('#dipersale_share_button').live('click', function(e) {     
      // sendGoal('http://node.mediamagic.co.il:50050/', sale.item.token.encoded, sale.transaction.id, new XMLHttpRequest(), function(res) {
      // 	console.log(res);
      // });
    });
    //    
	}	

  function isOnPage(param) {
    if(param && param != '')    
      return true;    

    return false;
  }

  function getFromReferer(referer, key) {

    referer = referer.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  
    var regexS = "[\\?&]" + key + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(referer);
  
    if(results == null) {
        return null;
    } else {
      if(results[1] && results[1] != '') 
          return decodeURIComponent(results[1]);
        else
          return null;
    }
  };
	// function isSuccessPage(elem) {
	// 	if(elem.getAttribute('role') && elem.getAttribute('role') == 'success')
	// 		return true;
	// // function isSuccessPage(refererUrl, clientUrl) {
	// // 	var reg = new RegExp("((http|https)(:\/\/))?((.*)" + clientUrl + "+)*\/?", "i");

	// // 	if(reg.exec(refererUrl)[4])
	// // 		return true;

	// 	return false;
	// };

	// function getReferenceId(url) {

	// 	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	
	// 	var regexS = "[\\?&]dri=([^&#]*)";
	// 	var regex = new RegExp(regexS);
	// 	var results = regex.exec(url);
	
	// 	if(results == null) {
	// 	    return null;
	// 	} else {
	// 		if(results[1] && results[1] != '') 
	// 	    	return decodeURIComponent(results[1]);
	// 	   	else
	// 	   		return null;
	// 	}
	// };

	// function validateItemAndClient(url, data, next) {
	// 	var params = '?' + $.param(data, true);

	// 	$.ajax({
	// 	    type: 'GET',
	// 	    url: url + params,
	// 	    crossDomain: true,
	// 	    beforeSend: function(xhr) {		    	

	// 	    },
	// 	    success: function(responseData, textStatus, jqXHR) {		    	
	// 	    		next(responseData);		    	
	// 	    },
	// 	    error: function (responseData, textStatus, errorThrown) {		    	
	// 	        next({error:responseData, valid:false});
	// 	    }
	// 	});
	// }

	// function reportSale(url, data, next) {
	// 	//data._csrf = JSON.parse(Base64.decode(data.token)).csrf;
		
	// 	$.ajax({
	// 	    type: 'POST',
	// 	    url: url,
	// 	    crossDomain: true,
	// 	    data: data,
	// 	    dataType: 'json',
	// 	    beforeSend: function(xhr) {		    	
	// 	    	xhr.setRequestHeader('X-CSRF-Token', JSON.parse(Base64.decode(data.token)).csrf);
	// 	    	//xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	// 	    },
	// 	    success: function(responseData, textStatus, jqXHR) {
	// 	    	console.log('ok')
	// 	        next(responseData);
	// 	    },
	// 	    error: function (responseData, textStatus, errorThrown) {
	// 	        console.log('error');
	// 	        next(responseData);
	// 	    }
	// 	});


	// 	// Xhr.open("POST", url, false);
	// 	// Xhr.setRequestHeader('X-CSRF-Token', JSON.parse(Base64.decode(data.token)).csrf);
 //  //   Xhr.send(data);

 //  //   if(Xhr.responseText && Xhr.responseText != '')
 //  //   	next(Xhr.responseText);	    
 //  //    next(null);
 //  }   else
  //

	function setCookie(_token, cookie) {
		cookie.Write('dispersale_token', _token, '/');
	}

	function getCookie(cookie) {
		var c = cookie.Read('dispersale_token');

		if(c && c != '')
			return c;
		
		return null; // todo: tell the server something went wrong, token not valid in cookie
	}

  //function getTokenFromServer(url, itemId, Xhr, next) {
  // function getTokenFromServer(url, data, next) {
  //   var params = '?' + $.param(data, true);    

  //   $.ajax({
  //       type: 'GET',
  //       url: url + params,
  //       crossDomain: true,
  //       beforeSend: function(xhr) {         

  //       },
  //       success: function(responseData, textStatus, jqXHR) {          
  //           next(responseData);         
  //       },
  //       error: function (responseData, textStatus, errorThrown) {         
  //           next({error:responseData, valid:false});
  //       }
  //   });

    // //TODO: if IE5 / IE6 we should do new ActiveXObject("Microsoft.XMLHTTP");
    //   Xhr.open("GET", url + itemId, false);
    //   Xhr.send(null);

    //   if(Xhr.responseText && Xhr.responseText != '')
    //     next(JSON.parse(Xhr.responseText));     
    //   else
    //     next(null);
  //}

	// function setToken(url, refId, Xhr, next) {
	// 	//TODO: if IE5 / IE6 we should do new ActiveXObject("Microsoft.XMLHTTP");
	//     Xhr.open("GET", url + refId, false);
	//     Xhr.send(null);

	//     if(Xhr.responseText && Xhr.responseText != '')
	//     	next(Xhr.responseText);	    
	//     else
	//     	next(null);
	// }

  var server = {
    get:function(action, data, next) {
      sendDataToServer(action, 'GET', data, next);
    },
    post:function(action, data, next) {
      sendDataToServer(action, 'POST', data, next);
    }
  }
  function sendDataToServer(action, method, data, next) {

    var defaultParams = '?' + $.param({ key:key, token:sale.token.encoded}, true);

    var ajax = {
        type: method,        
        crossDomain: true,        
        success: function(responseData, textStatus, jqXHR) { next(null, responseData); },
        error: function (responseData, textStatus, errorThrown) { next(errorThrown, responseData); }
    }

    if(method == 'GET') {
      var params = '&' + $.param(data, true);
      ajax.url = host + action + defaultParams + params;
    } else {
      ajax.data = data;
      ajax.dataType = 'json';      
      ajax.url = host + action + defaultParams;
      ajax.beforeSend = function(xhr) { xhr.setRequestHeader('X-CSRF-Token', JSON.parse(Base64.decode(sale.token.encoded)).csrf); };
    }

    $.ajax(ajax);
  }

})(window)

Cookie={
     /***** Write *****
     *Arguments:
     *name: the name of the cookie to set
     *value: the value to asign to the cookie
     *days: the days that the cookie will be avaliable, if empty the cookie is deleted when browser close
     *path: the path to the cookie in domain, if empty its = of the document path   
     ***Domain and others are not defined here, this is meant to be symple                                                                                                                               
     Cookie.Write("age",25,7,"/")
     */ 
   Write:function(name,value,days,path){
     if (days){
          var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            var expires = "; expires="+date.toGMTString();
     }else var expires = "";
     if (path){
        path="; path="+path
     }else path="";
     document.cookie = name+"="+value+expires+path;   
   },
   /***** WriteArray ******
    *Same as Write but this write a array
    *Cookie.WriteArray("user",[porfirio,25])                                         
   */
   WriteArray:function(name,value,days,path){
            this.Write(name,value.join("|-|"),days,path);
     },
     /***** Exist *****
      *This will check if a determinated cookie exists
      *Arguments:
      *name: the name of the cookie
      *Cookie.Exist("age") - return Boolean                                                                                                          
     */
   Exist:function(name){
     c=document.cookie;
     i=c.indexOf(name+"=")
     if (i==-1)
            return false;
     else{
              if (c.charAt(i-1)==" " ||c.charAt(i-1)==";" ||c.charAt(i-1)=="")
                return true;
              else
                return false;
         }  
     return (document.cookie.indexOf(name+"=")!=-1)
   },
   /***** IsArray ****
    *Returns true or false if the specified cookie is a array or not  
    *Arguments:
    *name: the name of the cookie
    *Cookie.IsArray("user")                                                                                            
     */
   IsArray:function(name){
            if (!this.Exist(name)){return 0};
            return (this.Read(name).indexOf("|-|")!=-1)
     },
     /***** Read ****
      *Return the value of the cookie           
    *Arguments:
    *name: the name of the cookie
    *Cookie.Read("age")                                                              
     */
   Read:function(name){
        if (this.Exist(name)){
         c=document.cookie;
         name=name+"="
         i=c.indexOf(name)
         i2=c.indexOf(";",i)
         if (i2==-1){
                        return c.substr(i+name.length);
                 }else{
                        return c.substring(i+name.length, i2);
                 }
            }else{
                 return "-1";
            }           
   },
     /***** ReadArray ****
      *Return a array with the values of the cookie ( if the cookie have a array )      
    *Arguments:
    *name: the name of the cookie
    *Cookie.ReadArray("user")                                                                
     */
   ReadArray:function(name){
     if (this.IsArray(name))
            return this.Read(name).split("|-|");
     },
     /***** Delete ****
      *Delete the cookie with the given name        
    *Arguments:
    *name: the name of the cookie
    *Cookie.Delete("user")                                                               
     */
   Delete:function(name){
     this.Write(name,"",-1);
   }
}

<!--

function getCookieVal (offset) {
  var endstr = document.cookie.indexOf (";", offset);
  if (endstr == -1)
    endstr = document.cookie.length;
  return unescape(document.cookie.substring(offset, endstr));
}
function GetCookie (name) {
  var arg = name + "=";
  var alen = arg.length;
  var clen = document.cookie.length;
  var i = 0;
  while (i < clen) {
    var j = i + alen;
    if (document.cookie.substring(i, j) == arg)
      return getCookieVal (j);
    i = document.cookie.indexOf(" ", i) + 1;
    if (i == 0) break;
  }
  return null;
}
function SetCookie (name,value,expires,path,domain,secure) {
  document.cookie = name + "=" + escape (value) +
    ((expires) ? "; expires=" + expires.toGMTString() : "") +
    ((path) ? "; path=" + path : "") +
    ((domain) ? "; domain=" + domain : "") +
    ((secure) ? "; secure" : "");
}

function DeleteCookie (name,path,domain) {
  if (GetCookie(name)) {
    document.cookie = name + "=" +
      ((path) ? "; path=" + path : "") +
      ((domain) ? "; domain=" + domain : "") +
      "; expires=Thu, 01-Jan-70 00:00:01 GMT";
  }
}



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
    var c = c1 = c2 = 0;
 
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

function getParams(a){var b=document.getElementsByTagName("script");for(var i=0;i<b.length;i++){if(b[i].src.indexOf("/"+a)>-1){var c=b[i].src.split("?").pop().split("&");var p={};for(var j=0;j<c.length;j++){var d=c[j].split("=");p[d[0]]=d[1]}return p}}return{}}
  function loadScript(url, callback) {

    var script = document.createElement("script");
    script.type = "text/javascript";

    if (script.readyState) { //IE
      script.onreadystatechange = function () {
        if (script.readyState == "loaded" || script.readyState == "complete") {
          script.onreadystatechange = null;
          callback();
        }
      }
    } else { //Others
      script.onload = function () {
      callback();
      }
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
  }