
const engine = require('../engine/telexine');
var SSE = require('../node_modules/sse-nodejs');
const util = require('util');
var GcLogParser = require('gc-log-parser');
const exec = util.promisify(require('child_process').exec);
module.exports ={

    build : function(req,res){

            var buildID = req.params.buildID;
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
             



        }
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  }
  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}