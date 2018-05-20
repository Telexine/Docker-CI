 var express = require('express');
var config = require('./service/config');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
var router = express.Router();
var pug = require('pug');

 
var routes = require('./routes');




//file handler
const fileUpload = require('express-fileupload');
const engine = require('./engine/telexine')

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
app.use(fileUpload());

app.use('/public',express.static('public'));
app.use('/node_modules',express.static('node_modules'));
app.use('/uploads/project/testing',express.static('report'));

app.get("/", function (req, res) {

  res.render('index', { title: 'Hey', message: 'Hello there!' })

/*   // html 

 var pages = req.params.pages;
 var html = fs.readFileSync('public/views/index.html');
 res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(html);
*/


})

engine.initializeMongo();
//API
app.use('/api',router);  // beta 
app.use('/api/v1',routes);

 
let createDockerCompose = function(projectfolder,thisTestPath,services){

// service 100 = node js 

  //create docker file 
  exec("touch "+thisTestPath+"/docker-compose.yml");
  exec(` echo 'version: "3"
  services:
    proj${projectfolder}:
        image: node:8.4.0-alpine
        build: .
        copy: . .
        command:
          - npm install
          - node index.js
        ports:
          - "3003:3000"
        volumes:
          - .:/usr/src/app/proj${projectfolder}
          - /usr/src/app/proj${projectfolder}/node_modules
              
' > ${thisTestPath}/docker-compose.yml`);
}


app.set('port', process.env.PORT || 3333);

http.createServer(app).listen(app.get('port'),
  function(){
    console.log("Server server listening on port " + app.get('port'));
});
 

process.on('SIGINT', function() {
  console.log( "\n shutting down  (Ctrl-C)" );
  engine.closingProcess();
  // some other closing procedures go here
  
});

 