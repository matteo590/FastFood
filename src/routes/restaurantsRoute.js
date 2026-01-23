const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

// Definizione delle rotte
router.post('/', restaurantController.createRestaurant);
router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.put('/:id', restaurantController.updateRestaurant);
router.delete('/:id', restaurantController.deleteRestaurant);


router.post('/:id/menu', restaurantController.addMenuItem);
router.delete('/:id/menu/:ItemId', restaurantController.deleteMenuItem);
router.put('/:id/menu', restaurantController.updateMenuItem);
router.get('/:id/menu', restaurantController.getMenu);


router.post('/:id/orders', restaurantController.createOrder);
router.put('/:id/orders/:orderId', restaurantController.updateOrder);
router.delete('/:id/orders/:orderId', restaurantController.deleteOrder);
router.get('/:id/orders', restaurantController.getAllOrders);
router.get('/:id/orders/:orderId', restaurantController.getOrderById);

module.exports = router;