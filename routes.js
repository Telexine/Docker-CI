let express = require('./node_modules/express');
let reportsCtrl = require('./controller/reports.controller.js');
let unitTestCtrl = require('./controller/unitTest.controller.js');



let router = express.Router();


router.route('/reports/:report_ID/:type').get(reportsCtrl.getReport);
router.route('/build/:buildID/:username/:proj/:service').get(unitTestCtrl.build);
router.route('/upload').post(unitTestCtrl.upload);
router.route('/user/:user_id/reports').get(reportsCtrl.getPastReport);

module.exports = router;
