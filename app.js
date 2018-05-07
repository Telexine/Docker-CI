 
var express = require('express');
var config = require('./service/config');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
var router = express.Router();
var pug = require('pug');
var GcLogParser = require('gc-log-parser');
var SSE = require('sse-nodejs');
 
var Rx = require('rxjs/Rx');

 
//const source = interval(1000);



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

engine.initializeMongo();
//API
 

app.use('/api',router);
let spawn,np;
let nmon;
router.get('/build/:buildID' ,function (req, res) {
  var buildID = req.params.buildID;

  // begin log testing data;
 // let id = engine.createTest(buildID,"uploads/project/testing/"+buildID+"/",1111);
 
 let refTestID;

 
 


 
  engine.createTest("dev","uploads/project/testing/"+buildID+"/",11111).then((data)=>{
  if(data){ refTestID=data;




  var parser = new GcLogParser();
  let cur_pid;
  var ev = SSE(res);
  let curFilepath = "uploads/project/testing/"+buildID+"/index.js";
  exec('npm install');
  
   spawn = require('child_process').spawn;
   np = spawn('node', ["--trace_gc", '--trace_gc_verbose', '--trace_gc_nvp',"--max_old_space_size=100",curFilepath],{detached: true});
   cur_np =np ;

  np.stdout.on('data', function (data) {
    // console.log(data.toString().trim());
    if(/\[[0-9]+:0x/gi.test(data.toString().trim())||/Fast promotion mode:/g.test(data.toString().trim())){

      data.toString().trim().split('\n').forEach(function (line) {
        parser.parse(line);
            try{ 
              var obj = JSON.stringify(parser.stats.spaces);
              for(var x in obj){
            //console.log(refTestID);
              engine.logStat(refTestID
                  ,JSON.parse(obj)[x].name,
                  JSON.parse(obj)[x].used,
                  JSON.parse(obj)[x].available,
                  JSON.parse(obj)[x].committed)
              .then((data)=>{
                //console.log(data);
              });
            
              }
            }
            catch(e){

            }
            
            });
            
          }else{

              ev.sendEvent('console', function () {
                return replaceAll(data.toString(),"\n"," &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp  ")
              });
              

        }


  });


  np.stderr.on('data', function (data) {
    ev.sendEvent('err', function () {
      return replaceAll(data.toString(),"\n","<br>")
    });
    console.log('stderr: ' + data.toString());
  });



  np.on('exit', function (code) {

    // SSE Event sender to close process 
    ev.sendEvent('end', function () {
     
      ev.removeEvent();
      try{
      return 'child process exited with code ' + code.toString();
    
        }catch(e){
          return"exit";

        } 
      
      });
 
 
  });



  ev.disconnect(function () {
      console.log("disconnected");
      // kill current process
      cur_np.stdin.pause();
      cur_np.kill();
      ev.removeEvent();
  });

}});
   
  })
//API Report 
router.get('/reports/:report_ID/:type', function(req, res) {
  let rid = req.params.report_ID;
  let type = req.params.type;
  let dataLog  = [];

/* 
1. mem - mem allocate
2. ns - new space 
3. os - old space 
4. cs - code space
5. map - map space
6. as - all space
7. los -  Large object space
*/  

let qtype;

switch (type){
    case "mem" : qtype ="Memory allocator";break;
    case "ns" : qtype ="New space";break;
    case "os" : qtype ="Old space";break;
    case "cs" : qtype ="Code space";break;
    case "map" : qtype ="Map space";break;
    case "los" : qtype ="Large object space";break;
    case "as" : qtype ="All spaces";break;
    default: res.send("error").statusCode('400'); // error
}


  engine.getReport(qtype,rid).then((data)=>{
    //get log promise 
      if(data) {
 
        //de-consruct log 
        var obj = JSON.stringify(data);


        /*
        for(var x in obj){
              // console.log(refTestID);

           
                  console.log(JSON.parse(obj)[x].name+
                  JSON.parse(obj)[x].used+
                  JSON.parse(obj)[x].available+
                  JSON.parse(obj)[x].committed);
                
 
            
        }*/
        



        res.status(200).send(obj); 
      }else res.status(404).send("ERROR");
    });
   


});

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

 
                  return res.status(200).send(filename.replace(".zip",""));
                   
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

let runNsdsdfdeProject = function(thisTestPath){
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
    //engine.addTest('ID1','pathtofile/','2222');
    console.log('Server is Runing on localhost:3333');
})
process.on('SIGINT', function() {
  console.log( "\n shutting down  (Ctrl-C)" );
  engine.closingProcess();
  // some other closing procedures go here
  
});

 