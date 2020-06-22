const db = require("../../../config/sequelize/database");
const User = require("../../../config/sequelize/User");
const UserLog = require("../../../config/sequelize/UserLog");

module.exports = {
  insert: (data, callback) => {
    db.sync()
      .then(() => {
        return User.create(data.dataToInsert).then(() => {
          callback(null, { status: "success", msg: "User data added" });
        });
      })
      .catch((error) => {
        callback(error, { msg: "Some error occured in adding the data" });
      });
  },

  update: (values, selector, callback) => {
    User.update(values, selector)
      .then((rowsUpdated) => {
        if (rowsUpdated[0]) {
          callback(null, {
            status: "success",
            rowUpdated: rowsUpdated[0],
            msg: "User data updated.",
          });
        } else {
          callback("Id doesn't found", null);
        }
      })
      .catch((err) => {
        callback(err, null);
      });
  },

  delete: (userId, cb) => {
    User.destroy({
      where: {
        id: userId.id,
      },
    })
      .then((check) => {
        if (check) {
          cb(null, {
            status: "success",
            rowDeleted: check,
            msg: "User deleted",
          });
        } else {
          cb("Id not found", {
            status: "failed",
            msg: "Id not found",
          });
        }
      })
      .catch((err) => {
        cb(err, {
          status: "failed",
          message: err,
        });
      });
  },

  select: (data, cb) => {
    User.findAll({
      where: data.condition,
      order: [["createdAt", "DESC"]],
    }).then(function (entries) {
      //only difference is that you get users list limited to 1
      //entries[0]
      cb(null, {
        status: "success",
        data: entries,
      });
    })
    .catch((err)=>{
      cb(err, {
        status: "failed",
        message: err
      });
    });
  },

  addUserLog: (data, callback) => {
    db.sync()
    .then(() => {
      return UserLog.create(data.dataToInsert).then(() => {
        callback(null, { status: "success", msg: "User log added" });
      });
    })
    .catch((error) => {
      callback(error, { msg: "Some error occured in adding the log" });
    });
  },

  removeUserLog: (userId, cb) => {
    UserLog.destroy({
      where: {
        user_id: userId.id,
      },
    })
      .then((check) => {
        if (check) {
          cb(null, {
            status: "success",
            rowDeleted: check,
            msg: "User logs deleted",
          });
        } else {
          cb("Id not found", {
            status: "failed",
            msg: "Id not found",
          });
        }
      })
      .catch((err) => {
        cb(err, {
          status: "failed",
          message: err,
        });
      });
  }
};
