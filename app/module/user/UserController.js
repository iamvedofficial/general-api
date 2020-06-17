const Joi = require("@hapi/joi");
const async = require("async");
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../../../config/sequelize/database");
const User = require("../../../config/sequelize/User");
const JoiValidation = require("../../helpers/joi/userValidation");
const DBClass = require("./model/UserModel");
const userHelper = require("../../helpers/UserHelper/userHelpers");
const config = require("../../../config/config");

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
    DBClass.insert(
      {
        dataToInsert: {
          username: data.username,
          email: data.email,
          password: bcrypt.hashSync(data.password, 10),
          mobile: data.mobile,
          picture: req.file !== undefined ? req.file.path : null,
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
 * @function   userLogin
 * @param  id(required), password(required)
 * @return json response
 */
APIController.userLogin = (req, res) => {
  console.log("Inside the User Login:: ");
  let sess = req.session;
  console.log("Inside the login:: ", sess);
  function loginValidation(callback) {
    try {
      let data = req.body;
      console.log("inside the login validation:: ", data, typeof data);
      const value = JoiValidation.loginSchema.validateAsync(data);
      value
        .then((checkValidation) => {
          callback(null, data);
        })
        .catch((err) => {
          console.log("Error:: ", err);
          callback(err.details[0].message, null);
        });
    } catch (err) {
      callback(err, null);
    }
  }

  function checkDB(data, callback) {
    console.log("Check Email Id is present in Database");
    DBClass.select(
      {
        condition: {
          email: data.email,
        },
      },
      (err, result) => {
        if (!err) {
          console.log("Inside the if Block:: ", err);
          console.log("Result:: ", result);
          if (result.data.length) {
            callback(null, {
              status: "success",
              data: data,
              userDetails: result,
            });
          } else {
            callback("email or password is wrong. Please check ", {
              status: "failed",
              err: "email or password is wrong. Please check ",
            });
          }
        } else {
          console.log("Error:: ", err);
          callback(err, {
            status: "failed",
            err: err,
          });
        }
      }
    );
  }

  function login(userData, callback) {
    console.log("Hashed password from the database:: ", userData);
    if (
      !bcrypt.compareSync(
        userData.data.password,
        userData.userDetails.data[0].password
      )
    ) {
      console.log("Wrong password!!!!!!!!!!");
      callback("password is wrong. please try again.", { code: 400 });
    } else {
      var tokenData = {
        email: userData.userDetails.data[0].email,
        username: userData.userDetails.data[0].username,
        id: userData.userDetails.data[0].id,
        user_type: userData.userDetails.data[0].user_type,
      };

      var resultData = {
        token: jwt.sign(tokenData, config.TOKEN_GENERATION, {
          expiresIn: "60m",
        }),
        email: userData.userDetails.data[0].email,
        username: userData.userDetails.data[0].username,
        id: userData.userDetails.data[0].id,
        user_type: userData.userDetails.data[0].user_type,
      };
      callback(null, {
        userDetails: resultData,
        message: "Login Successful",
      });
    }
  }

  function addToken(data, callback) {
    let values = { token: data.userDetails.token };

    let selector = {
      where: { id: data.userDetails.id },
    };
    DBClass.update(values, selector, (err, result) => {
      if (!err) {
        callback(null, { userDetails: data.userDetails });
      } else {
        callback(err, { msg: "Error in adding token" });
      }
    });
  }

  function addUserLog(data, callback) {
    console.log("Add User Log:: ", data);
    DBClass.addUserLog(
      {
        dataToInsert: {
          user_id: data.userDetails.id,
          user_type: data.userDetails.user_type,
          action: "login",
        },
      },
      (err, result) => {
        if (!err) {
          callback(null, {
            userDetails: data.userDetails,
            msg: "login successful",
          });
        } else {
          callback(err, {
            err: "error in adding details",
            err_type: "adding_error",
          });
        }
      }
    );
  }

  async.waterfall(
    [loginValidation, checkDB, login, addToken, addUserLog],
    (err, result) => {
      if (!err) {
        res.status(200).json({
          status: "success",
          data: result,
        });
      } else {
        console.log("Error:: ", err);
        res.status(200).json({
          status: "failed",
          err: err,
        });
      }
    }
  );
};
/*
 * Delete user's details from database
 * only admin can remove any user from data base
 *
 * @function   removeUser
 * @param  id
 * @return json response
 */
APIController.removeUser = (req, res) => {
  function validateId(callback) {
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

  function checkToken(data, callback) {
    console.log('Checking token in Remove user:: ', data);
    let decode = jwt.verify(data.token, config.TOKEN_GENERATION);
    console.log("Decoded in remove:: ", decode);
    DBClass.select(
      {
        condition: {
          token: data.token,
          id: decode.id,
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
          console.log("Error:: ", err);
          callback(err, {
            status: "failed",
            err: err,
          });
        }
      }
    );
  }

  function removeUser(data, callback) {
    let decoded = jwt.verify(data.token, config.TOKEN_GENERATION);
    if (decoded.user_type === "A" && data.id !== decoded.id) {
      DBClass.delete(
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
    } else {
      callback("Authentication required to do this action.", {
        msg: "Authentication required",
        err_msg: "authentication_required",
      });
    }
  }

  async.waterfall([validateId, checkToken, removeUser], (err, result) => {
    if (!err) {
      res.status(200).json(result);
    } else {
      res.json({
        status: "failed",
        err: err,
      });
    }
  });
};

/*
* Edit user's details in database
* 
* @function   updateUserDetails
* @param  id(required for Admin), name(optional),mobile(optional),
          url(optional), email(optional)
* @return json response
*/
APIController.updateUserDetails = (req, res) => {
  function validateEdit(callback) {
    if (req.body.token) {
      try {
        let data = req.body;
        const value = JoiValidation.editSchema.validateAsync(data);
        value
          .then((checkValidation) => {
            callback(null, data);
          })
          .catch((err) => {
            console.log("Error:: ", err);
            callback(err.details[0].message, null);
          });
      } catch (err) {
        callback(err, null);
      }
    } else {
      callback("Token required. Please login and get token.", {
        err: "Token required. Please login and get token.",
        err_type: "token_required",
      });
    }
  }

  function checkToken(data, callback) {
    console.log('Checking token in Remove user:: ', data);
    let decode = jwt.verify(data.token, config.TOKEN_GENERATION);
    console.log("Decoded in remove:: ", decode);
    DBClass.select(
      {
        condition: {
          token: data.token,
          id: decode.id,
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
          console.log("Error:: ", err);
          callback(err, {
            status: "failed",
            err: err,
          });
        }
      }
    );
  }

  function editUserDetails(passedData, callback) {
    console.log('Passed Data by admin: ', passedData);
    let values = [];
    let decoded = jwt.verify(req.body.token, config.TOKEN_GENERATION);
    if (decoded.user_type === "A") {
      if (passedData.id) {
        for (let [key, value] of Object.entries(passedData)) {
          if (key != "id") {
            values[key] = value;
          }
        }
        if (req.file !== undefined) {
          values["picture"] = req.file.path;
        } else {
          callback("Image required, Please add the picture.", {
            msg: "Image required, Please add the picture.",
            err_type: "image_required",
          });
        }

        let selector = {
          where: { id: passedData.id },
        };

        DBClass.update(values, selector, (err, result) => {
          if (!err) {
            callback(null, result);
          } else {
            callback(err, result);
          }
        });
      } else {
        callback("Id required do edit the user details by admin.", {
          msg: "Admin can't edit without user id.",
          err_type: "user_id_required",
        });
      }
    } else {
      for (let [key, value] of Object.entries(passedData)) {
        if (key != "id") {
          values[key] = value;
        }
      }
      if (req.file !== undefined) {
        values["picture"] = req.file.path;
      } else {
        callback("Image required, Please add the picture.", {
          msg: "Image required, Please add the picture.",
          err_type: "image_required",
        });
      }

      let selector = {
        where: { id: decoded.id },
      };

      DBClass.update(values, selector, (err, result) => {
        if (!err) {
          callback(null, result);
        } else {
          callback(err, result);
        }
      });
    }
  }

  async.waterfall([validateEdit, checkToken, editUserDetails], (err, result) => {
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



/*
* Logout user, logout disable the token for the further works
* 
* @function   logout
* @param  token(required)
* @return json response
*/
APIController.logout = (req, res) => {
  function validateData(callback) {
    try {
      let data = req.body;
      console.log("inside the Logut validation:: ", data);
      const value = JoiValidation.logoutSchema.validateAsync(data);
      value
        .then((checkValidation) => {
          callback(null, data);
        })
        .catch((err) => {
          console.log("Error:: ", err);
          callback(err.details[0].message, null);
        });
    } catch (err) {
      callback(err, null);
    }
  }

  function logoutUser(data, callback) {
    let decoded = jwt.verify(data.token, config.TOKEN_GENERATION);
    console.log("decoded Object :: ", decoded);
    let values = { token: null };
    let selector = {
      where: { id: decoded.id },
    };
    DBClass.update(values, selector, (err, result) => {
      if (!err) {
        callback(null, { data: decoded });
      } else {
        callback(err, { msg: "Error in updating token" });
      }
    });
  }

  function addUserLog(userData, callback) {
    console.log("Add User Log in logout:: ", userData);
    DBClass.addUserLog(
      {
        dataToInsert: {
          user_id: userData.data.id,
          user_type: userData.data.user_type,
          action: "logout",
        },
      },
      (err, result) => {
        if (!err) {
          callback(null, { msg: "logout successfully" });
        } else {
          callback(err, {
            err: "error in adding details",
            err_type: "adding_error",
          });
        }
      }
    );
  }

  async.waterfall([validateData, logoutUser, addUserLog], (err, result) => {
    if (!err) {
      res.status(200).json({
        status: "success",
        msg: "user logout successfully",
      });
    } else {
      res.json({
        status: "failed",
        msg: err,
      });
    }
  });
};


module.exports = APIController;
