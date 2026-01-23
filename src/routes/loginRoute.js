const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");

// Rotte CRUD
router.post("/signup", loginController.validateSignup);
router.post("/login", loginController.validateLogin);
router.put("/:id", loginController.updateUser);
module.exports = router;