const async = require("async");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../../../config/sequelize/User");
const JoiValidation = require("../../helpers/joi/userValidation");
const DBClass = require("./UserModel");
const config = require("../../../config/config");
const Helpers = require("../../helpers/UserHelper/userHelpers");

// The User controller.
const UserController = {};

/*
 *   Add user in database
 *
 * @function   register
 * @param  username, email, mobile, password
 * @return json response
 */

UserController.register = (req, res) => {
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
          if (err.name === "SequelizeUniqueConstraintError") {
            callback(err.errors[0].message, null);
          } else {
            callback("Error in registering the user", result);
          }
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
      if (req.file) {
        Helpers.deleteFileFromTheFolder(
          {
            path: req.file.path,
          },
          (error, result) => {
            res.json({
              status: "failed",
              err: err,
            });
          }
        );
      } else {
        res.json({
          status: "failed",
          err: err,
        });
      }
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
UserController.addBusiness = (req, res) => {
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
UserController.userLogin = (req, res) => {
  function loginValidation(callback) {
    try {
      let data = req.body;
      const value = JoiValidation.loginSchema.validateAsync(data);
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

  function checkDB(data, callback) {
    DBClass.select(
      {
        condition: {
          email: data.email,
        },
      },
      (err, result) => {
        if (!err) {
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
          callback(err, {
            status: "failed",
            err: err,
          });
        }
      }
    );
  }

  function login(userData, callback) {
    if (
      !bcrypt.compareSync(
        userData.data.password,
        userData.userDetails.data[0].password
      )
    ) {
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

UserController.removeUser = (req, res) => {
  let token = req.headers["x-access-token"];
  function validateToken(callback) {
    try {
      let data = req.body;
      const decoded = jwt.verify(token, config.TOKEN_GENERATION);
      if (decoded.user_type === "A") {
        DBClass.select(
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
        callback("Not authorized to do this action", {
          status: "failed",
          err_msg: "authorization_error",
        });
      }
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        callback("Token expired", {
          status: "failed",
          err_msg: "token_expired",
        });
      } else {
        callback("Error in token", {
          status: "failed",
          err_msg: "token_error",
        });
      }
    }
  }

  function validateId(data, callback) {
    try {
      const decoded = jwt.verify(token, config.TOKEN_GENERATION);
      const value = JoiValidation.removeSchema.validateAsync(data);
      value
        .then((checkValidation) => {
          DBClass.select(
            {
              condition: {
                id: data.id,
              },
            },
            (err, result) => {
              if (!err) {
                if (result.data.length) {
                  
                  if (result.data[0].dataValues.user_type === "A" && data.id != decoded.id) {
                    callback("Not authorized to remove this user", null);
                  } else {
                    callback(null, result.data[0].dataValues);
                  }
                } else {
                  callback("Id not found in DB", {
                    status: "failed",
                    err: "Id not found in DB",
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
        })
        .catch((err) => {
          callback(err.details[0].message, null);
        });
    } catch (err) {
      callback(err, null);
    }
  }


  function removeUserLogs(data, callback) {
    DBClass.removeUserLog(
      {
        id: data.id,
      },
      (err, result) => {
        if (!err) {
          callback(null, data);
        } else if (result.err_type === "unknown_id") {
          callback(null, data);
        } else {
          callback(err, result);
        }
      }
    );
  }

  function removeUserFromDB(data, callback) {
    DBClass.delete(
      {
        id: data.id,
      },
      (err, result) => {
        if (!err) {
          if (data.picture) {
            Helpers.deleteFileFromTheFolder(
              {
                path: data.picture,
              },
              (err, result) => {
                if (!err && result.status === "success") {
                  callback(null, data);
                } else {
                  callback("Error in deleteing the file", {
                    status: "failed",
                  });
                }
              }
            );
          } else {
            callback(null, data);
          }
          // callback(null, data);
        } else {
          callback(err, result);
        }
      }
    );
  }

  async.waterfall(
    [validateToken, validateId, removeUserLogs, removeUserFromDB],
    (err, result) => {
      if (!err) {
        res.status(200).json({
          status: "success",
          msg: "User removed from database",
        });
      } else {
        res.json({
          status: "failed",
          err: err,
        });
      }
    }
  );
};

/*
* Edit user's details in database
* 
* @function   updateUserDetails
* @param  id(required for Admin), name(optional),mobile(optional),
          url(optional), email(optional)
* @return json response
*/
UserController.updateUserDetails = (req, res) => {
  let token = req.headers["x-access-token"];
  function validateToken(callback) {
    try {
      let data = req.body;
      const decoded = jwt.verify(token, config.TOKEN_GENERATION);
      if (decoded.user_type === "A") {
        DBClass.select(
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
      } else if (decoded.user_type === "U") {
        if (decoded.id == data.id || data.id === undefined) {
          DBClass.select(
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
          callback("Not Authorized to do edit", {
            status: "failed",
            msg: "authorization_error",
          });
        }
      }
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        callback("Token expired", {
          status: "failed",
          err_msg: "token_expired",
        });
      } else {
        callback("Error in token", {
          status: "failed",
          err_msg: "token_error",
        });
      }
    }
  }

  function validateEdit(data, callback) {
    try {
      const value = JoiValidation.editSchema.validateAsync(data);
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

  function isAdmin(data, callback) {
    const decoded = jwt.verify(token, config.TOKEN_GENERATION);
    DBClass.select(
      {
        condition: {
          id: data.id ? data.id : decoded.id,
        },
      },
      (err, result) => {
        if (!err) {
          if (result.data.length) {
            if (result.data[0].dataValues.user_type === "A" && decoded.id != result.data[0].dataValues.id) {
              callback("Not authorized to do this action", {
                status: "failed",
                err_type: "authorization_error",
              });
            } else {
              callback(null, data);
            }
          } else {
            callback("Id Not Found in Db.", {
              status: "failed",
              err: "Id not found in Db.",
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
  }

  function modifyUserDetails(passedData, callback) {
    try {
      let decoded = jwt.verify(token, config.TOKEN_GENERATION);
      let values = [];
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
        where: { id: passedData.id ? passedData.id : decoded.id },
      };
      Helpers.deleteFileFromTheFolder(
        {
          path: passedData.oldPhotoPath,
        },
        (err, result) => {
          if (!err && result.status === "success") {
            DBClass.update(values, selector, (err, result) => {
              if (!err) {
               callback(null, result);
              } else {
                callback(err.errors[0].message, result);
              }
            });
          } else {
            callback(err, result);
          }
        }
      );
    } catch (err) {
      callback(err, null);
    }
  }

  async.waterfall(
    [validateToken, validateEdit, isAdmin, modifyUserDetails],
    (err, result) => {
      if (!err) {
        res.status(200).json({
          status: "success",
          msg: " user data modified succesfully.",
        });
      } else {
        Helpers.deleteFileFromTheFolder(
          {
            path: req.file.path,
          },
          (error, result) => {
            res.json({
              status: "failed",
              err: err,
            });
          }
        );
      }
    }
  );
};

/*
 * Logout user, logout disable the token for the further works
 *
 * @function   logout
 * @param  token(required)
 * @return json response
 */
UserController.logout = (req, res) => {
  let token = req.headers["x-access-token"];
  function validateData(callback) {
    try {
      let data = req.body;
      const value = JoiValidation.logoutSchema.validateAsync(data);
      value
        .then((checkValidation) => {
          callback(null, data);
        })
        .catch((err) => {
          if (err.name === "JsonWebTokenError") {
            callback("Token error", {
              status: "failed",
              err_msg: "token_error",
            });
          } else {
            callback(err.details[0].message, null);
          }
        });
    } catch (err) {
      callback(err, null);
    }
  }

  function logoutUser(data, callback) {
    let decoded = jwt.verify(token, config.TOKEN_GENERATION);
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

module.exports = UserController;
