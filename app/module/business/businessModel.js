const db = require("../../../config/sequelize/database");
const Business = require("../../../config/sequelize/Business");

module.exports = {
  insert: (data, callback) => {
    db.sync()
      .then(() => {
        return Business.create(data.dataToInsert).then(() => {
          callback(null, { status: "success", msg: "Business added successfully." });
        });
      })
      .catch((error) => {
        callback(error, { msg: "Some error occured in adding the data" });
      });
  },

  update: (values, selector, callback) => {
    Business.update(values, selector)
      .then((rowsUpdated) => {
        if (rowsUpdated[0]) {
          callback(null, {
            status: "success",
            rowUpdated: rowsUpdated[0],
            msg: "Business data updated.",
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
    Business.destroy({
      where: {
        id: userId.id,
      },
    })
      .then((check) => {
        if (check) {
          cb(null, {
            status: "success",
            rowDeleted: check,
            msg: "Business deleted",
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
    Business.findAll({
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
  }
};
