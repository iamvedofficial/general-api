const fs = require('fs');

module.exports = {
    deleteFileFromTheFolder:  (data, callback)=>{
    
        if(data.path){
            if(fs.existsSync(data.path)){
                fs.unlink(data.path, (err)=>{
                    if(err){
                        callback(err, {status: 'failed', msg: 'Error occured in the deleting the file.'});
                    } else {
                        callback(null, {status: 'success', msg: 'File has been deleted.'});
                    }
                });
            } else {
                callback('Filename does not exists', {status: 'failed', msg: 'Filename does not exists', err_type: "file_not_find"});
            }
        }
    }
}