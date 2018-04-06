
var express = require('express');
var config = require('./service/config');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');

var pug = require('pug');
/**\
 *
 *  DIRECTIVE 
 *    var u = {UID: 5, userEmail: "rtester@testing.com", userPassword: "bd4eb56b41fc3663dfe2761ff34621a544ecfe27", userLastLogin: "2017-11-20T22:18:13.000Z", userToken: "cae45ae7e68ef8024d4ad5b56c68f263"}
  res.render('index', { user: u });

 */
//const compiledFunction = pug.compileFile('./layouts/index.pug');
app.set('view engine', 'pug')
app.set("views", path.join(__dirname, "layouts"));


//express
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
 

app.use('/public',express.static('public'));
app.use('/node_modules',express.static('node_modules'));

app.get("/", function (req, res) {

  res.render('index', { title: 'Hey', message: 'Hello there!' })
 
 
})


http.createServer(app).listen(3333, function () {
    console.log('Server is Runing on localhost:3333');
})
