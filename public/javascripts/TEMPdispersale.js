(function(window) {

	var host = window.location.protocol + '//' + '**SERVER_HOST**';
	var key = '**KEY**';

	if(!key || key == '') {
		console.log('no dispersale key');
		return;
	}

	if(typeof($) == 'undefined') {
		loadScript("//ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function () {
			$.noConflict();
			loadCode();
		});
	} else {
		$.noConflict();
		loadCode();
	}

	var sale = {};

	var loadCode = function() {
	
		jQuery(document).ready(function() {	

			var referer = window.location.href;		
			var wrapper = document.getElementById('dispersale_wrapper'); 

			if(!wrapper) {
				wrapper = document.createElement('div');
				wrapper.setAttribute('id', 'dispersale_wrapper');
				document.body.appendChild(wrapper);
			}

			sale = {
				item: {
					id:null,
				},
				items: [],
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

			if(sale.page.product) { // user on product page
				console.log('this is product page');

				sale.item.id = wrapper.getAttribute('item');

				if(sale.item.id && sale.item.id != '') { // making sure the item attr is available and an item is present

					server.get('/getItemByIdentifier', { identifier:sale.item.id }, function(err, res) { // converting the client item id with dispersale item id
						if(err)
							return console.log(err);

						if(res.error == 0) {
							sale.item.id = res.item;   

							if(sale.token.encoded) { // user came from viral link and he got a token 

								var showDispersaleBanner = true;

								sale.token.decoded = JSON.parse(Base64.decode(sale.token.encoded));

								if(sale.item.id != sale.token.decoded.item) {
									console.log('error: token item id not equal to page item id');
									return;
								}

								server.get('/validateItemAndClient', { item:sale.item.id }, function(err, res) {
									if(err)
										return console.log(err);

									if(res.error == '0') {
										
										setCookie(sale.item.id, Cookie);
										
										//todo: need to find a way to save the data on cookie that will hold all other items as well with the token referer
										//		if the user is first level user its easy, we can hold just the id's for the items he visited but if it came with token we need to save them all togeter some how

										buildClientInformation('2P', wrapper);
									} else {
										console.log(res.error);
									return;
									}
								});

							} else { // user probebly came to the page by him self and he doesnt have token, we need to create new one for him
								console.log('first level user');
							}

						} else {
							console.log(res.message);
							return;
						}
					});

				} else {
					console.log('soft error: no item attribute or item is empty in product page')
				}

			} else if(sale.page.success) { // user on success page
				console.log('this is success page');

				sale.items = wrapper.getAttribute('items');

				if(sale.items) { // making sure the items attr is available
					sale.items = sale.items.split(',');

					
				} else {
					console.log('soft error: no items attribute in success page')
				}				

			} else { // user on inner page
				console.log('this is inner page');
			}

		});

	}

	function setCookie(item, cookie) {
		var c = getCookie(cookie);
		
    var items = [];
    var data = {
      items:[],
      token:null
    };

		if(c) {
			console.log('cookie available');

      data = Base64.decode(c);
      data = JSON.parse(data);

      if(data.items.indexOf(item) <= -1)
        data.items.push(item);

      console.log(data)
		} else {
			console.log('cookie not available');
      
      items.push(item);
      
      data.items = items;
      data.token = sale.token.encoded;     
		}

    data = JSON.stringify(data); 
    data = Base64.encode(data);

		cookie.Write('dispersale_' + key, data, 30, '/');
	}

	function getCookie(cookie) {
		if(cookie.Exist('dispersale_' + key)) {
			return cookie.Read('dispersale_' + key);
		} else {
			return null;	
		}
	}

	function buildClientInformation(type, elem) {
		switch(type) {
			case '1P': // first level user on product page
				elem.innerHTML = 'we support Dispersale for this item (<a href="#">read more</a>)';
			break;
			case '1S': // first level user on success page
				
			break;
			case '2P': // second level user on product page
				elem.innerHTML = 'buy this product and give your friend incentive!!! (<a href="#">read more</a>)';
			break;
			case '2S': // second level user on success page

			break;
			default:
			break;
		}
	}

	var server = {
		get:function(action, data, next) {
			sendDataToServer(action, 'GET', data, next);
		},
		post:function(action, data, next) {
			sendDataToServer(action, 'POST', data, next);
		}
	}

	function sendDataToServer(action, method, data, next) {

		var defaultParams = '?' + jQuery.param({ key:key, token:sale.token.encoded}, true);

		var ajax = {
			type: method,        
			crossDomain: true,        
			success: function(responseData, textStatus, jqXHR) { next(null, responseData); },
			error: function (responseData, textStatus, errorThrown) { next(errorThrown, responseData); }
		}

		if(method == 'GET') {
			var params = '&' + jQuery.param(data, true);
			ajax.url = host + action + defaultParams + params;
		} else {
			ajax.data = data;
			ajax.dataType = 'json';      
			ajax.url = host + action + defaultParams;
			ajax.beforeSend = function(xhr) { xhr.setRequestHeader('X-CSRF-Token', JSON.parse(Base64.decode(sale.token.encoded)).csrf); };
		}

		jQuery.ajax(ajax);
	}

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

})(window);

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