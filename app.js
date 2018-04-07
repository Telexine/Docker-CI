 
var express = require('express');
var config = require('./service/config');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
var router = express.Router();
var pug = require('pug');

//file handler
const fileUpload = require('express-fileupload');
const util = require('util');
const exec = util.promisify(require('child_process').exec);


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


//API

app.use('/api',router);

router.get('/build' ,function (req, res) {

    res.end('build');
   
   
  })


router.post('/upload', function(req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');
  
  let sampleFile = req.files.sampleFile;
  let filename =  Date.now()+".zip";
   
  sampleFile.mv(__dirname+'/uploads/project/'+ filename, function(err) {
    if (err)
      return res.status(500).send(err);
    
    zxfv(filename);
    res.send('File uploaded!');
  });
});



// FILE operation
//zxfv('1523120704998.zip');
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
        if(stdout.replace(/(\r\n\t|\n|\r\t)/gm,"").includes(filename)){
            cmd = 'unzip uploads/project/'+filename + ' -d  uploads/project/testing/'+filename.replace(".zip","") ;

            exec(cmd ,
             (error, stdout, stderr) => {
                    if(error){
                        console.error(`exec error: ${error}`);
                        return;
                    }
            });
        }
 
        //console.log(`stderr: ${stderr}`);
      });
 
}




http.createServer(app).listen(3333, function () {
    console.log('Server is Runing on localhost:3333');
})
