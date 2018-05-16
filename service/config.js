var  MongoClient  = require('mongodb');
var Promise  = require('bluebird');
var  logger  = require('winston');
 
 var MongoClient  = function() {   MongoClient.connect(config.database.url, { promiseLibrary: Promise }, (err, db) => {
        if (err) {
          logger.warn(`Failed to connect to the database. ${err.stack}`);
        }
        app.locals.db = db;
        app.listen(config.port, () => {
          logger.info(`Node.js app is listening at http://localhost:${config.port}`);
        });
      });
    
};

exports.conn = MongoClient;