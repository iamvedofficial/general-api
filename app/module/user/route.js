"use strict";
const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const upload = multer({dest: 'public/upload/images'});

const APIController = require("./UserController");
const config = require("../../../config/config");

app.use((req, res, next) => {
  // .. some logic here .. like any other middleware
  next();
});

app.post("/get-Token", (req, res) => {
  // Authenticate User
  const username = req.body.username;
  const user = { name: username };

  const accessToken = generateAccessToken(user);
  res.json({ accessToken: accessToken });
});

//app.post("/register", upload, APIController.register); //main register
app.post("/register", APIController.register);

app.post("/user-login", APIController.userLogin);

app.delete("/remove-user", APIController.removeUser);

// app.put("/update-details", upload, APIController.updateUserDetails); // old main

app.put("/update-details", APIController.updateUserDetails); 

app.post("/users/add-business", authenticateTokenForAdmin, APIController.addUserBusiness);

app.post("/logout", APIController.logout);

function generateAccessToken(user) {
  return jwt.sign(user, config.ACCESS_TOKEN_SECRET, { expiresIn: "30m" });
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
