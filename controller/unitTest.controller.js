
const engine = require('../engine/telexine');
var SSE = require('../node_modules/sse-nodejs');
const util = require('util');
var GcLogParser = require('gc-log-parser');
const exec = util.promisify(require('child_process').exec);
const fileUpload = require('../node_modules/express-fileupload');
const getPort = require('../node_modules/get-port');
var http = require('http');

const fs = require('fs');

var subprocess = require('subprocess');

 




module.exports ={

    build : function(req,res){
          
            var buildID = req.params.buildID;
            let refTestID;
            let username = req.params.username;
            let service = req.params.service;
            let Proj_name = req.params.proj;
            console.log(Proj_name);
            engine.createTest(username,"uploads/project/testing/"+buildID+"/",Proj_name,service).then((data)=>{
            if(data){ 
              refTestID=data;


              var parser = new GcLogParser();
              let cur_pid;
              var ev = SSE(res);
              let curFilepath = "uploads/project/testing/"+buildID+"/index.js";
              try{
                 exec('npm install');
              }catch(e){}

              
              cur_np = require('child_process').spawn;   //spawn gc process
              auditor = require('child_process').spawn;  //spawn Audit 
              
              b_Audited = false;  // is audit complete 
              // Audit Mode 
              if(service=="true"){
                 
                try{
                getPort().then(port => {
                  console.log(port);
                  //=> 51402
                  var processes = {
                    app: {
                      command: 'node',
                      commandArgs: [curFilepath, '%port%'],
                      port: port
                    }
                  };
                   
                  subprocess(processes, function(error, processes){
                    if (error) {
                      console.error(error.stack);
                      process.exit(1);
                    }
                    console.log('processes started successfully!');
                    console.log('running Audit Mode');
                    let ad= auditor("lighthouse",["http://localhost:"+port,"--output","html","--output-path",curFilepath.replace("/index.js","/report.html")]);
                    ad.on('exit', function (code) {
                      console.log('finished  Audit');
                      b_Audited = true;
                    });
                  });

                });
              }catch(e){
                
              }

              }
              np = cur_np('node', ["--trace_gc", '--trace_gc_verbose', '--trace_gc_nvp',"--max_old_space_size=100",curFilepath],{detached: true});
              //send Build ID to client 
              ev.sendEvent('unitID', function () {
                return refTestID;
              });


              np.stdout.on('data', function (data) {
                // console.log(data.toString().trim());
                if(/\[[0-9]+:0x/gi.test(data.toString().trim())||/Fast promotion mode:/g.test(data.toString().trim())){
            
                  data.toString().trim().split('\n').forEach(function (line) {
                    parser.parse(line);
                        try{ 
                          var obj = JSON.stringify(parser.stats.spaces);
                          for(var x in obj){
                        //console.log(refTestID);
                          engine.logStat(refTestID,
                              JSON.parse(obj)[x].name,
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

            
              np.stderr.on('error', function (data) {
                ev.sendEvent('err', function () {
                  return replaceAll(data.toString(),"\n","<br>")
                });
                console.log('stderr: ' + data.toString());
              });
            
            
            
              np.on('exit', function (code) {
                if(service=="true"){ // audit mode on 
                    if(!b_Audited){ //is audited 
                        var recheck = setInterval(function(){ 
                            if(b_Audited){
                              clearInterval(recheck);
                              ev.sendEvent('end', function () {
                                return 'child process exited with code ' + code.toString()+ '<br>   And Audit completed ';
                               });
                            }
                        }, 1000);
                      
                    }else{
                      //audit complete soon as gc // 1th percentile 
                      ev.sendEvent('end', function () {
                       return 'child process exited And :   Audit completed ';
                      });
                    }
                }else{
                // SSE Event sender to close process 
                ev.sendEvent('end', function () {
                  
                  ev.removeEvent();
                  try{
                  return 'child process exited with code ' + code.toString();
                
                    }catch(e){
                      return"exit";
            
                    } 
                  });
              
                }  });

              // on web client Close (user close the web,conn lost )
              ev.disconnect(function () {
                  console.log("disconnected");
                  // kill current process
                  np.stdin.pause();
                  np.kill();
                  if(service=="true"){ // audit mode on 
                    try{
                    ad.stdin.pause();
                    ad.kill();
                    }catch(e){}
                  }
                  ev.removeEvent();
              });
            }
          });
        },

      upload : function (req,res){


        if (!req.files) return res.status(400).send('No files were uploaded.');

        let Id = req.body.id; // userid
        let projectname = req.body.proj;
        let service = req.body.service;  // "node,Express : 1,0,0"
        let sampleFile = req.files.file;
        let filename =  Date.now()+".zip";
        
        
        sampleFile.mv(__dirname+'/../uploads/project/'+ filename, function(err) {
          if (err){
            return res.status(500).send(err);
          }

          exec('ls uploads/project', (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              return;
            }
            
            //file exist Extracting
            console.log("file Extracting");
            thisPath = "uploads/project/"+filename;
            thisTestPath = "uploads/project/testing/"+filename.replace(".zip","");
            if(stdout.replace(/(\r\n\t|\n|\r\t)/gm,"").includes(filename)){
                cmd = 'unzip '+ thisPath+" -d "+ thisTestPath ;

                exec(cmd ,
                (error, stdout, stderr) => {
                        if(error){
                            console.error(`exec error: ${error}`);
                            return;
                        } 
                        cmd = "rm -f "+thisPath;
                        exec(cmd ,
                          (error, stdout, stderr) => {
                                  if(error){
                                      console.error(`exec error: ${error}`);
                                      return;
                           } 
                          });


                        return res.status(200).send(filename.replace(".zip",""));     
                });
            }
          });
        });

        
}



}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  }
  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}