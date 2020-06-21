const crypto = require('crypto');
const fs = require('fs');
const config = require('../../helpers/UserHelper/userHelpers');

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
                callback('Filename does not exists or invalid filename', {status: 'failed', msg: 'Filename does not exists or invalid filename'});
            }
        }
    }
}