const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController');

// Rotte CRUD
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.put("/:id/setRole/:role", userController.setRole);
router.delete("/:id", userController.deleteUser);

module.exports = router;