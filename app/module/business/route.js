"use strict";
const express = require("express");
const router = express.Router();
const BusinessController = require("./BusinessController");

router.use((req, res, next) => {
  // .. some logic here .. like any other middleware
  next();
});

router.post("/add", BusinessController.addBusiness);

router.put("/edit", BusinessController.editBusiness);

router.delete('/delete', BusinessController.deleteBusiness);

module.exports = router;

