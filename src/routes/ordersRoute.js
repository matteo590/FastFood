const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Rotte CRUD
router.post("/", orderController.createOrder);
router.get("/", orderController.getOrders);
router.get("/by-user/:userId", orderController.getOrdersByUserId);
router.get("/:id", orderController.getOrderById);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);

module.exports = router;