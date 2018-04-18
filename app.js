 
var express = require('express');
var config = require('./service/config');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
var router = express.Router();
var pug = require('pug');

var SSE = require('sse-nodejs');

//file handler
const fileUpload = require('express-fileupload');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const engine = require('./engine/telexine')

/**\
 *
 *  DIRECTIVE 
 *    var u = {UID: 5, userEmail: "rtester@testing.com", userPassword: "bd4eb56b41fc3663dfe2761ff34621a544ecfe27", userLastLogin: "2017-11-20T22:18:13.000Z", userToken: "cae45ae7e68ef8024d4ad5b56c68f263"}
  res.render('index', { user: u });

 */
//const compiledFunction = pug.compileFile('./layouts/index.pug');



engine.initializeMongo();

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

app.get("/", function (req, res) {

  res.render('index', { title: 'Hey', message: 'Hello there!' })
 
 
})


//API
 

app.use('/api',router);

router.get('/build/:buildID' ,function (req, res) {
  var buildID = req.params.buildID;
  var ev = SSE(res);

  exec('npm install');
  let spawn = require('child_process').spawn,
  np = spawn('node', ["uploads/project/testing/"+buildID+"/index.js"]);



  np.stdout.on('data', function (data) {
    ev.sendEvent('console', function () {

      return replaceAll(data.toString(),"\n","<br> &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp  ")
    });
    console.log('stdout: ' + data.toString());
  });


  np.stderr.on('data', function (data) {
    ev.sendEvent('err', function () {
      return replaceAll(data.toString(),"\n","<br>")
    });
    console.log('stderr: ' + data.toString());
  });



  np.on('exit', function (code) {
    ev.sendEvent('end', function () {
      return 'child process exited with code ' + code.toString();
      ev.removeEvent();
    });
    console.log('child process exited with code ' + code.toString());
  });

  ev.disconnect(function () {
      console.log("disconnected");
      ev.removeEvent();
  });

  //ev.removeEvent('time',3100);

   
  })


router.post('/upload', function(req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  let Id = req.body.id; // userid
  let projectname = req.body.proj;
  let service = req.body.service;  // "node,mango,mysql : 1,0,0"
  let sampleFile = req.files.file;
  let filename =  Date.now()+".zip";

  sampleFile.mv(__dirname+'/uploads/project/'+ filename, function(err) {
    if (err){
      return res.status(500).send(err);
    }

    exec('ls uploads/project', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      
      //file exist Extracting
      console.log("file exist Extracting");
      thisPath = "uploads/project/"+filename;
      thisTestPath = "uploads/project/testing/"+filename.replace(".zip","");
      if(stdout.replace(/(\r\n\t|\n|\r\t)/gm,"").includes(filename)){
          cmd = 'unzip -j '+ thisPath+" -d "+ thisTestPath ;

          exec(cmd ,
           (error, stdout, stderr) => {
                  if(error){
                      console.error(`exec error: ${error}`);
                      return;
                  }

                 // createDockerCompose(filename.replace(".zip",""),thisTestPath,100);
                  
                  //runNodeProject(thisTestPath);
                  return res.status(200).send(filename.replace(".zip",""));
                  //exec('docker-compose up '+thisTestPath+'/docker-compose.yml');
          });
        


      }

      //console.log(`stderr: ${stderr}`);
    });





    
  });
});


async function zxfv(filename) {

 
 /*
    exec('ls uploads/project', (error, stdout, stderr) => {

    });*/
    // check file is exist
    exec('ls uploads/project', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        
        //file exist Extracting
        console.log("file exist Extracting");
        thisPath = "uploads/project/"+filename;
        thisTestPath = "uploads/project/testing/"+filename.replace(".zip","");
        if(stdout.replace(/(\r\n\t|\n|\r\t)/gm,"").includes(filename)){
            cmd = 'unzip -j '+ thisPath+" -d "+ thisTestPath ;

            exec(cmd ,
             (error, stdout, stderr) => {
                    if(error){
                        console.error(`exec error: ${error}`);
                        return;
                    }

                    console.log("path"+thisTestPath);
                    return thisTestPath;
            });
          


        }
 
        //console.log(`stderr: ${stderr}`);
      });
 
}

let runNodeProject = function(thisTestPath){
  exec('npm install');
  var spawn = require('child_process').spawn,
    np    = spawn('node', [thisTestPath+"/index.js"]);






  np.stdout.on('data', function (data) {

 

    console.log('stdout: ' + data.toString());
  });

  np.stderr.on('data', function (data) {
    console.log('stderr: ' + data.toString());
  });

  np.on('exit', function (code) {
    console.log('child process exited with code ' + code.toString());
  });


}


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

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

http.createServer(app).listen(3333, function () {
    console.log('Server is Runing on localhost:3333');
})
