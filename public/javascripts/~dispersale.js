(function(window) {
	
	window.onload = function() {
		var referer = window.location.href;		

		var wrapper = document.getElementById('dispersale_wrapper'); 
		var sale = {
			item: {
				id:wrapper.getAttribute('item')
			},
			transaction: {
				id:wrapper.getAttribute('transaction')
			},
			reference: {
				id:getReferenceId(referer)
			},
			page: {
				success: wrapper.getAttribute('role') == 'success' ? true : false
			},
			token: null
		}
		
		if(!sale.item.id || sale.item.id == '') {
			//todo: tell the server and show dispersale error page
			return;
		}

		if(sale.reference.id) { // user came from viral link
			var Xhr = new XMLHttpRequest();
			setToken('http://node.mediamagic.co.il:50050/getToken?dri=', sale.reference.id, Xhr, function(_token) {
				sale.token = _token;
				if(!sale.token) {
					//todo: show error page!
					return;
				}			
			});			
		} else { // user is the first one to buy

			if(sale.success) { // success page
				sale.token = getToken(Cookie);

				if(sale.transaction.id && sale.transaction.id != '' && token) {
					// tell the server we got a sale!!!!	
					Xhr = new XMLHttpRequest();
					sendGoal('http://node.mediamagic.co.il:50050/', sale.token, sale.transaction.id, Xhr);
				}
				wrapper.innerHTML = 'Share your purchase and earn money at www.dispersale.com (token:' + sale.token + ')'; //todo: let the user choose if he would like to share his purchase

			} else { // sale page
				// TODO: make informative iframe (let the user know this site support dispersale)
				setCookie(sale.token, Cookie);	
				wrapper.innerHTML = 'this site supports Dispersale!';
			}		
		}
	}	

	// function isSuccessPage(elem) {
	// 	if(elem.getAttribute('role') && elem.getAttribute('role') == 'success')
	// 		return true;
	// // function isSuccessPage(refererUrl, clientUrl) {
	// // 	var reg = new RegExp("((http|https)(:\/\/))?((.*)" + clientUrl + "+)*\/?", "i");

	// // 	if(reg.exec(refererUrl)[4])
	// // 		return true;

	// 	return false;
	// };

	function getReferenceId(url) {

		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	
		var regexS = "[\\?&]dri=([^&#]*)";
		var regex = new RegExp(regexS);
		var results = regex.exec(url);
	
		if(results == null) {
		    return null;
		} else {
			if(results[1] && results[1] != '') 
		    	return decodeURIComponent(results[1]);
		   	else
		   		return null;
		}
	};

	function sendGoal(_token, _transactionId, Xhr) {
		Xhr.open("POST", url, false);
	    Xhr.send({ token:_token, transactionId:_transactionId });

	    if(Xhr.responseText && Xhr.responseText != '')
	    	next(Xhr.responseText);	    
	    else
	    	next(null);
	}

	function setCookie(_token, cookie) {
		cookie.Write('dispersale_token', _token, '/');
	}

	function getToken(cookie) {
		var c = cookie.Read('dispersale_token');

		if(c && c != '')
			return c;
		
		return null; // todo: tell the server something went wrong, token not valid in cookie
	}

	function setToken(url, refId, Xhr, next) {
		//TODO: if IE5 / IE6 we should do new ActiveXObject("Microsoft.XMLHTTP");
	    Xhr.open("GET", url + refId, false);
	    Xhr.send(null);

	    if(Xhr.responseText && Xhr.responseText != '')
	    	next(Xhr.responseText);	    
	    else
	    	next(null);
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