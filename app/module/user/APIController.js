const Joi = require("@hapi/joi");
const async = require("async");
const multer = require('multer');
const bcrypt = require('bcrypt');
const db = require("../../../config/sequelize/database");
const User = require("../../../config/sequelize/User");
const JoiValidation = require("../../helpers/joi/userValidation");
const DBClass = require("./model/dbQuery");

// The authentication controller.
const APIController = {};
/*
*   Add user in database
* 
* @function   register
* @param  username, email, mobile, password
* @return json response
*/

APIController.register = (req, res) => {
  function validateData(callback) {
    try {
      let data = req.body;
      const value = JoiValidation.registerSchema.validateAsync(data);
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

  function addInDB(data, callback) {
    DBClass.insert({
      dataToInsert: {
        username: data.username,
        email: data.email,
        password: bcrypt.hashSync(data.password, 10),
        mobile: data.mobile,
      }
    },(err, result) => {
        if(!err){
          callback(null, result);
        } else {
          callback(err, result);
        }
    });
  }

  async.waterfall([validateData, addInDB], (err, result) => {
    if (!err) {
      res.status(200).json({
        status: "success",
        msg: "User added successfully",
      });
    } else {
      res.json({
        status: "failed",
        err: err,
      });
    }
  });
};

/*
*   Add url and location in database
* 
* @function   addBusiness
* @param  id, url, location
* @return json response
*/
APIController.addBusiness = (req, res) => {
  let passedData = req.body;

  let values = { url: passedData.url, location: passedData.location };
  let selector = {
    where: { id: passedData.userId },
  };

  User.update(values, selector)
    .then((rowsUpdated) => {
      
      if (rowsUpdated[0]) {
        res.json({
          rowUpdated: rowsUpdated[0],
          msg: "Data updated",
        });
      } else {
        res.json({
          rowUpdated: rowsUpdated[0],
          msg: "Id Doesn't found",
        });
      }
    })
    .catch((err) => {
      res.status(400).json({
        err_msg: err,
      });
    });
};

/*
* login user 
* 
* @function   removeUser
* @param  id
* @return json response
*/
APIController.userLogin = (req, res) => {
  console.log('Inside the User Login:: ');
    function loginValidation(callback){
      try {
        let data = req.body;
        console.log('inside the login validation:: ', data, typeof data);
        const value = JoiValidation.loginSchema.validateAsync(data);
        value
          .then((checkValidation) => {
            callback(null, data);
          })
          .catch((err) => {
            console.log('Error:: ', err);
            callback(err.details[0].message, null);
          });
      } catch (err) {
        callback(err, null);
      }
    }

    function checkDB(data, callback){
      console.log('Check Email Id is present in Database');
      DBClass.select({
        condition: {
          email: data.email
        }
      }, (err, result)=>{
        if(!err){
          console.log('Inside the if Block:: ', err);
          console.log('Result:: ', result);
          callback(null, {
            status: 'success',
            data: data,
            userDetails: result
          });
        } else {
          console.log('Error:: ', err);
          callback(err, {
            status: 'failed',
            err: err
          });
        }
      });      
    }

    function login(userData, callback){
      console.log('Hashed password from the database:: ', userData);
      if (!bcrypt.compareSync(userData.data.password, userData.userDetails.data[0].password)) {
          console.log('Wrong password!!!!!!!!!!');
          callback('password is wrong. please try again.', {code: 400});
      } else {
          console.log('Password is correct.');
         
          callback(null, {data: userData, message: 'Login Successful'});
      }
    }

    async.waterfall([loginValidation, checkDB, login],(err, result)=>{
      if(!err){
        res.status(200).json({
          status: 'success',
          data: result
        });
      } else {
        console.log('Error:: ', err);
        res.status(200).json({
          status: 'failed',
          err: err
        });
      }
    });
}
/*
* Delete user's details from database
* 
* @function   removeUser
* @param  id
* @return json response
*/
APIController.removeUser = (req, res) => {
  function validateId(callback){
    try {
      let data = req.body;
    
      const value = JoiValidation.removeSchema.validateAsync(data);
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

  function removeUser(data, callback) {
    DBClass.delete({
      id: data.id
    },(err, result)=>{
        if(!err){
          callback(null, result);
        } else {
          callback(err, result);
        }
    })
  }

  async.waterfall([validateId, removeUser], (err, result)=>{
    if(!err){
      res.status(200).json(result);
  } else {
    res.json({
      status: 'failed',
      err: err
    });
  }
  });
};

/*
* Edit user's details in database
* 
* @function   updateUserDetails
* @param  id(required), name(optional),mobile(optional),
          url(optional), email(optional)
* @return json response
*/
APIController.updateUserDetails = (req, res) => {
  function validateEdit(callback) {
    try {
      let data = req.body;
      const value = JoiValidation.editSchema.validateAsync(data);
      value
        .then((checkValidation) => {
          callback(null, data);
        })
        .catch((err) => {
          console.log('Error:: ', err);
          callback(err.details[0].message, null);
        });
    } catch (err) {
      callback(err, null);
    }
  }

  function editUserDetails(passedData, callback) {
    let values = [];

    for (let [key, value] of Object.entries(passedData)) {
      if (key != "id") {
        values[key] = value;
      }
    }
    if(req.file !== undefined){
      values['picture'] = req.file.path;
    }

    let selector = {
      where: { id: passedData.id },
    };
   
    DBClass.update(values, selector, (err, result)=>{
      if(!err){
          callback(null, result);
      } else {
          callback(err, result);
      }
    });
  }

  async.waterfall([validateEdit, editUserDetails], (err, result) => {
    if (!err) {
      res.status(200).json({
        status: "success",
        msg: " user data modified succesfully.",
      });
    } else {
      res.json({
        status: "failed",
        err: err,
      });
    }
  });
};


APIController.uploadPicture = (req, res)=>{
  console.log('Data passed From :: ', req.body);
  console.log('File details:: ', req.file);
}

APIController.checkQuery = (req, res)=>{
  let data = req.body;
  console.log('Passed Data:: ', data);

  DBClass.select({
    modal: data.modal,
    condition: {
      email: data.email
    }
  }, (err, result)=>{
    if(!err){
      console.log('Inside the if Block:: ', err);
      console.log('Result:: ', result);
      res.status(200).json({
        status: 'Success',
        data: result
      });
    } else {
      console.log('Error:: ', err);
      res.status(200).json({
        status: 'failed',
        error: err
      });
    }
  });

}

module.exports = APIController;
