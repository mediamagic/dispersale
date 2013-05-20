var request = require("request")

process.on('message', function(args) {
  var siteUrl = args.siteUrl;
  var cdnUrl = args.cdnUrl;

  request(siteUrl, function(error, response, body) {
    var re = /<script.*?src ?= ?"([^"]+)"/gm;
    var match;
    
    while(match = re.exec(body)) {
       if(match[1].split('?')[0] == cdnUrl) {            
        process.send(true);
        return;
       }
    }

    process.send(false);
  });
});

