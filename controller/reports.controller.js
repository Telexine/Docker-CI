
const engine = require('../engine/telexine');

module.exports ={


    getReport : function(req,res){
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
                    res.status(200).send(obj); 
                }else res.status(404).send("ERROR");
            });
            
        
            


    }


}