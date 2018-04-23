
//var Promise  = require('bluebird');
//var  logger  = require('winston');
const mongoose = require('mongoose');
const util = require('util');
const exec = util.promisify(require('child_process').execSync);
let  child  =require('child_process');
const DATABASE_CONECTION = 'mongodb://localhost/docker-ci';

var CISchema = mongoose.Schema({
    user_id: String,
    path: String,
    port: Number,
    Unit_test: String
  });
 
  var statSchema = mongoose.Schema({
    Unit_test: String,
    totalHeapSize: Number,
    usedHeapSize: Number,
    TimeStamp: {type: Date,default: Date.now}
  });


Unit_test = exports.Unit_test = mongoose.model('Unit_test', CISchema);
Stat = exports.Stat = mongoose.model('Stat', statSchema);

exports.initializeMongo = function() {
 
    console.log('\n\n===================\ninit mongo container\n===================\n\n');
    //build  docker
            mongoose.connect(DATABASE_CONECTION);
  
            console.log('Trying to connect to ' + DATABASE_CONECTION);
          
            var db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error: We might not be as connected as I thought'));
            db.once('open', function() {
              console.log(' connected ! ');

              addTest('ID1','pathtofile/','2222').then(function(result){
               console.log(result);
                
              });
            // console.log(addTest('ID1','pathtofile/','2222'));
             addStat('ID1',123,456);
            });
            
     
}







  var addStat = function(unit_test,totalHeapSize,usedHeapSize) {
    var rec = new Stat({
        Unit_test: unit_test,
        totalHeapSize: totalHeapSize,
        usedHeapSize: usedHeapSize,
    });
  
    rec.save(function (err, fluffy) {
      if (err) return console.error(err);
      console.log('addStat');
    });
  }


var addTest = function(User_id,Path,Port) {
    var rec = new Unit_test({
        user_id: User_id,
        path: Path,
        port: Port
    });
  
    rec.save(function (err, savc) {
      if (err) return console.error(err);
       var id = rec._id;
       return id;
    });


  }




/**
 * 
 * 
 * 
 var spawn = require('child_process').spawn;
var child = spawn('node ./commands/server.js');
child.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
    //Here is where the output goes
});
child.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
    //Here is where the error output goes
});
child.on('close', function(code) {
    console.log('closing code: ' + code);
    //Here you can get the exit code of the script
});
 * 
 * 
 * 
*/