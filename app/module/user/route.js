"use strict";
const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const db = require("../../../config/sequelize/database");
const APIController = require("./UserController");
const DbClass = require("./UserModel");
const config = require("../../../config/config");

app.use((req, res, next) => {
  // .. some logic here .. like any other middleware
  next();
});
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype == "image/jpeg" || file.mimetype == "image/png") {
      cb(
        null,
        path.join(path.dirname(require.main.filename), "public/upload/images")
      );
    } else {
      cb("File type not allowed", null);
    }
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + "" + path.extname(file.originalname)
    );
  },
});

let upload = multer({
  storage: storage,
}).single("imagePost");

app.post("/get-Token", (req, res) => {
  // Authenticate User
  const username = req.body.username;
  const user = { name: username };

  const accessToken = generateAccessToken(user);
  res.json({ accessToken: accessToken });
});

app.post("/register", upload, APIController.register);

app.post("/user-login", APIController.userLogin);

app.put("/addBusiness", authenticateToken, APIController.addBusiness);

app.delete("/remove-user", APIController.removeUser);

app.put("/update-details", upload, APIController.updateUserDetails);

app.post("/users/add-business", authenticateTokenForAdmin, APIController.addUserBusiness);

app.post("/logout", APIController.logout);

function generateAccessToken(user) {
  return jwt.sign(user, config.ACCESS_TOKEN_SECRET, { expiresIn: "30m" });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, config.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    next();
  });
}

function authenticateTokenForAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null)
    return res.status(401).json({
      status: "failed",
      msg: "Token required.",
    });

  jwt.verify(token, config.TOKEN_GENERATION, (err, user) => {
    if (err || user.user_type == "U")
      return res.status(403).json({
        status: "failed",
        msg: "Aothorization error",
      });
    next();
  });
}

module.exports = app;
