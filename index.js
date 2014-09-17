var express = require('express');
var app = express();
var parser = require('rssparser');
var extractor = require('unfluff');
var request = require('request');
var iconv  = require('iconv-lite');

var HEAD = [
          '<!DOCTYPE html>',
          '<head>',
          '<meta name="viewport" content="width=device-width, initial-scale=1">',
          '</head>',
          '<body style="line-height: 130%;">'
           ].join('');

var FOOT = [
          '</body>',
          '</html>'
          ].join('');

var buffer = '',
    bufferDate = new Date(); //buffer hourly


app.get('/', function(req, res){
  //res.header("Content-Type", "text/html; charset=utf8");

  if (!buffer || (new Date() - bufferDate) > 30 * 60 * 1000){
    var html = '<h1>Spiegel Online</h1>',
        item;

    var url = req.protocol + '://' + req.get('Host');
 
    var options = {
    };
    //rss feeds
    parser.parseURL(url +'/proxy?uri=http://www.spiegel.de/schlagzeilen/tops/index.rss', options, function(err, out){
      //res.send(JSON.stringify(out));

      for (var i=0, ii=out.items.length;i<ii;i+=1){
        item = out.items[i];
        html += '<p>'+
                '<a href="/unfluff?uri=' + item.url + '">' + 
                iconv.decode(item.title, 'UTF-8') + '</a>' +
                '<br>' +  iconv.decode(item.summary, 'UTF-8') + '</p>';
      }
      buffer = HEAD + html + FOOT;
      bufferDate = new Date();
      res.send(HEAD + html + FOOT);
    });
  } else {
    res.send(buffer + '<hr>BUFFERED: ' + bufferDate);
  }
});

app.get('/proxy', function(req, res){
  res.header("Content-Type", "text/html; charset=utf-8");
  request({url:req.query.uri, method:'GET', encoding: null}, function (error, response, body) {
    res.send(iconv.decode(body, 'ISO-8859-1'));
  });
});

app.get('/unfluff', function(req, res){
  res.set({
    'Content-Type': 'text/html; charset=ISO-8859-1'
  });

  var html = '',
      data;
  request({url:req.query.uri, method:'GET', encoding: null}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      data = extractor(iconv.decode(body, 'ISO-8859-1'), 'de');
      html += '<p><a href="/">Back</a></p><hr>';
      html += '<h3>' + data.title + '</h3>';
      html += '<p><a href="'+ req.query.uri +'" target="_blank">' + req.query.uri+ '</a></p>';
      if (data.image != null) {html += '<img style="max-width: 100%;" src="' + data.image  +'"/>';}
      html += '<p>' + data.text + '</p>';
      html += '<hr><a href="/"><p>Back</p></a>';
      res.send(HEAD + html + FOOT); // Print the google web page.
    }
  })  
});

if(require.main === module){
  app.listen(3000);
} else { 
  module.exports = app; 
}
