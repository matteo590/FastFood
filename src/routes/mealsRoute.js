const express = require("express");
const router = express.Router();
const mealController = require("../controllers/mealsController");

// Rotte CRUD
router.post("/", mealController.createMeal);
router.get("/byRestaurant/:restaurantId", mealController.getMealsByRestaurant);
router.get("/:id", mealController.getMealById);
router.put("/:id", mealController.updateMeal);
router.delete("/:id", mealController.deleteMeal);

module.exports = router;