const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const async = require("async");

const db = require("../../../config/sequelize/database");
const businessModel = require("./businessModel");
const userModel = require("../user/UserModel");
const Business = require("../../../config/sequelize/Business");
const config = require("../../../config/config");
const validator = require('../../helpers/joi/businessValidation');

const BusinessController = {};

BusinessController.addBusiness = (req, res) => {
  let token = req.headers["x-access-token"];
  function validateToken(callback) {
    try {
        let data = req.body;
        console.log('Data passed: ', data);
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
  console.log('Inside the insert data:: ');
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
        console.log('After adding business data in DB:: ',result);
        callback(null, result);
      } else {
        console.log('Error in adding the data:: ', err);
        callback(err, result);
      }
    }
  );
}
  async.waterfall([validateToken, validatePassedData, insertData], (err, result) => {
    console.log("Err:: ", err);
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

module.exports = BusinessController;
