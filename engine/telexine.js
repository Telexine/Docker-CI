const mongoose = require('mongoose');
const compose = require('docker-compose');
const util = require('util');
const exec = util.promisify(require('child_process').execSync);
let  child  =require('child_process');
const DATABASE_CONECTION = 'mongodb://localhost:27017/docker-ci';
var Rx = require('rxjs/Rx');
var observables = require('mongoose-observables');


var CISchema = mongoose.Schema({
    user_id: String,
    path: String,
    audit: Boolean,
    proj_name: String,
    TimeStamp: {type: Date,default: Date.now}

  });
 
  var statSchema = mongoose.Schema({
    UnitID: String,
    name: String,
    used: Number,
    available: Number,
    committed: Number,
    TimeStamp: {type: Date,default: Date.now}
  });


Unit_test = exports.Unit_test = mongoose.model('Unit_test', CISchema);
Stat = exports.Stat = mongoose.model('Stat', statSchema);

exports.initializeMongo = function() {
 
  console.log('\n\n===================\ninitialize\n===================\n');
  compose.up({ cwd: 'engine/', log: false })
  .then(
    () => { console.log('[x] init mongo container complete!!!!');
      let spawn = require('child_process').spawn,
      np    = spawn('node', ["engine/adminMongo/app.js"]);
      console.log('[x] init adminMongo complete!!!! on localhost:1234')
      process.stdout.write(('\nconnecting...\n'));
  
      
      setTimeout(function() { 
        mongoose.connect(DATABASE_CONECTION);
      }, 3000); // hot fix wait for 3 sec to connect

    
              console.log('Trying to connect to ' + DATABASE_CONECTION);
            
              var db = mongoose.connection;
              db.on('error', console.error.bind(console, 'connection error: We might not be as connected as I thought'));
              db.once('open', function() {
                console.log('[x] connected ! ');
  

                console.log('\n\n## ready to use ## \n');
              });
               
  }, 
    err => { console.log('something went wrong:', err.message)}
  );


}

 
exports.logStat = function(unitID,Name,Used,Available,Committed){
  return new Promise(resolve=>{
observables.creator
    .create(Stat, {
      UnitID: unitID,
      name: Name,
      used: Used,
      available: Available,
      committed: Committed,
    })
    .subscribe(Stat =>{ 
      resolve(Stat._id);}, 
      err =>{
        throw err
      });
  }
)};


exports.getReport = function(type,testID){
  
/* 
1. mem - mem allocate
2. ns - new space 
3. os - old space 
4. cs - code space
5. map - map space
6. as - all space
7. los -  Large object space
*/  

  let data = [] ;
  return new Promise(resolve=>{
  observables.finder
    .find(Stat, {UnitID:testID,name:type})
    .subscribe(Stat => {
      //console.log(Stat)
      resolve(Stat);
    }
    , err =>{
        throw err;
    });
  });
  
}


exports.getReportsByUser = function(User_id){
  
    //console.log(testID);
    let data = [] ;
    return new Promise(resolve=>{
    observables.finder
      .find(Unit_test, {user_id:User_id})
      .subscribe(Stat => {
        resolve(Stat);
      }
      , err =>{
          throw err;
      });
    });
   
  
    
   
  
   
  
  
  
    
  }








//create function 
exports.createTest = function(User_id,Path,Proj_name,Audit){
  return new Promise(resolve=>{
observables.creator
    .create(Unit_test, {
      user_id: User_id,
      path: Path,
      proj_name:Proj_name,
      audit: Audit
    })
    .subscribe(Unit_test =>{ 
      resolve(Unit_test._id);}, 
      err =>{
        throw err
      });
  }
)};
  
//* call func
/*
 this.createTest().then((data)=>{
    console.log(data );
 });
*/

addStat = function(unit_test,name,used,available,committed) {
    var rec = new Stat({
        Unit_test: unit_test,
        name: name,
        used: used,
        available: available,
        committed: committed,
    });
  
    rec.save(function (err, fluffy) {
      if (err) return console.error(err);
      console.log('addStat');
    });
  }

 





exports.closingProcess =  function(){

compose.down({ cwd: 'engine/', log: true })
  .then(
    () => { console.log('[x] closed container!!!!');
    process.exit(1);
  }, 
    err => { console.log('something went wrong:', err.message)}
  );
}