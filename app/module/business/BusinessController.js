const jwt = require("jsonwebtoken");
const async = require("async");

const businessModel = require("./businessModel");
const userModel = require("../user/UserModel");
const Business = require("../../../config/sequelize/Business");
const config = require("../../../config/config");
const validator = require('../../helpers/joi/businessValidation');

const BusinessController = {};

/*
 * Add Business in business table, Only Admin can add
 *
 * @function   addBusiness
 * @param  name(required), description(optional), status(required)
 * @headers x-access-token[required]
 * @return json response
 */
BusinessController.addBusiness = (req, res) => {
  let token = req.headers["x-access-token"];
  function validateToken(callback) {
    try {
        let data = req.body;
      const decoded = jwt.verify(token, config.TOKEN_GENERATION);
      if(decoded.user_type === 'A'){
        userModel.select(
          {
            condition: {
              token: token,
              id: decoded.id,
            },
          },
          (err, result) => {
            if (!err) {
              if (result.data.length) {
                callback(null, data);
              } else {
                callback("User not loged in.", {
                  status: "failed",
                  err: "User not loged in.",
                });
              }
            } else {
              callback(err, {
                status: "failed",
                err: err,
              });
            }
          }
        );
        // callback(null, data);
      } else {
        callback("Not authorized to do this action", {status: 'failed', err_msg: 'authorization_error'})
      }
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        callback('Token expired', {status: 'failed', err_msg: 'token_expired'});
      } else {
          callback("Error in token", {status: 'failed', err_msg: 'token_error'});
      }
    }
  }

  function validatePassedData(data, callback) {
    try {
      const value = validator.addBusinessValidation.validateAsync(data);
      value
        .then((checkValidation) => {
          callback(null, data);
        })
        .catch((err) => {
          callback(err.details[0].message, null);
        });
    } catch (err) {
      callback(err, null);
    }
  }

function insertData(data, callback){
  businessModel.insert(
    {
      dataToInsert: {
        name: data.name,
        description: (data.description !== undefined)? data.description: null,
        status: data.status,
      },
    },
    (err, result) => {
      if (!err) {
        callback(null, result);
      } else {
        callback(err, result);
      }
    }
  );
}
  async.waterfall([validateToken, validatePassedData, insertData], (err, result) => {
    if(!err){
      res.status(200).json({
        status: "success",
        msg: "Business added in Database successfully.",
      });
    } else {
      res.json({
        status: "failed",
        err: err
      }); 
    }
   
  });
};

/*
 * edit Business in business table, Only Admin can edit
 *
 * @function   editBusiness
 * @param  id(required), name(required), description(optional), status(optional)
 * @headers x-access-token[required]
 * @return json response
 */
BusinessController.editBusiness = (req, res) => {
  let token = req.headers["x-access-token"];
  function validateToken(callback) {
    try {
        let data = req.body;
      const decoded = jwt.verify(token, config.TOKEN_GENERATION);
      if(decoded.user_type === 'A'){
        userModel.select(
          {
            condition: {
              token: token,
              id: decoded.id,
            },
          },
          (err, result) => {
            if (!err) {
              if (result.data.length) {
                callback(null, data);
              } else {
                callback("User not loged in.", {
                  status: "failed",
                  err: "User not loged in.",
                });
              }
            } else {
              callback(err, {
                status: "failed",
                err: err,
              });
            }
          }
        );
      } else {
        callback("Not authorized to do this action", {status: 'failed', err_msg: 'authorization_error'})
      }
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        callback('Token expired', {status: 'failed', err_msg: 'token_expired'});
      } else {
          callback("Error in token", {status: 'failed', err_msg: 'token_error'});
      }
    }
  }

  function validateData(data, callback){
    try {
      const value = validator.editBusinessValidation.validateAsync(data);
      value
        .then((checkValidation) => {
          callback(null, data);
        })
        .catch((err) => {
          callback(err.details[0].message, null);
        });
    } catch (err) {
      callback(err, null);
    }
  }

  function editData(data, callback){
    let selector = {
      where: { id: data.id },
    };
    businessModel.update(data, selector, (err, result) => {
      if (!err) {
        callback(null, result);
      } else {
        callback(err, { msg: "Error in adding token" });
      }
    });
  }

async.waterfall([validateToken, validateData, editData],(err, result)=>{
  if(!err){
    res.status(200).json({
      status: "success",
      msg: "Business edited successfully"
    });
  } else {
    res.json({
      status: "failed",
      msg: err
    });
  }
});

}


/*
 * Remove Business from business table, Only Admin can remove
 *
 * @function   deleteBusiness
 * @param  id(required)
 * @headers x-access-token[required]
 * @return json response
 */
BusinessController.deleteBusiness = (req, res) => {
  let token = req.headers["x-access-token"];
  function validateToken(callback) {
    try {
        let data = req.body;
      const decoded = jwt.verify(token, config.TOKEN_GENERATION);
      if(decoded.user_type === 'A'){
        userModel.select(
          {
            condition: {
              token: token,
              id: decoded.id,
            },
          },
          (err, result) => {
            if (!err) {
              if (result.data.length) {
                callback(null, data);
              } else {
                callback("User not loged in.", {
                  status: "failed",
                  err: "User not loged in.",
                });
              }
            } else {
              callback(err, {
                status: "failed",
                err: err,
              });
            }
          }
        );
      } else {
        callback("Not authorized to do this action", {status: 'failed', err_msg: 'authorization_error'})
      }
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        callback('Token expired', {status: 'failed', err_msg: 'token_expired'});
      } else {
          callback("Error in token", {status: 'failed', err_msg: 'token_error'});
      }
    }
  }

  function validateData(data, callback){
   try{
    let value = validator.deleteBusinessValidation.validateAsync(data);
    value.then(validationResult=>{
      callback(null, data);
    }).catch(err => {
      callback(err.details[0].message, null);
    })
   } catch(e){
     callback("some error in validating the passed data", {status: "failed", msg: "validation_error", err: e})
   }
  }

  function deleteData(data, callback) {
    businessModel.delete(
      {
        id: data.id,
      },
      (err, result) => {
        if (!err) {
          callback(null, result);
        } else {
          callback(err, result);
        }
      }
    );
  } 

  async.waterfall([validateToken, validateData, deleteData], (err, result)=>{
    if(!err){
      res.status(200).json({
        status: "success",
        msg: "Business deleted successfully"
      });
    } else {
      res.json({
        status: 'failed',
        err: err
      });
    }
  })
}

module.exports = BusinessController;
