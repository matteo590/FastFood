const Restaurant = require('../models/Restaurants');

// CREA UN RISTORANTE
exports.createRestaurant = async (req, res) => {
  try {
    const { name, logo, owner, category, address, piva
     } = req.body;
    const newRestaurant = new Restaurant({ name, logo, owner, category, address, piva });
    const savedRestaurant = await newRestaurant.save();
    res.status(201).json(savedRestaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nella creazione del ristorante' });
  }
};

// OTTIENE TUTTI I RISTORANTI
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate('owner', 'name email')
      .populate('menu.meal')
      .populate('orders');
    res.json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nel recupero dei ristoranti' });
  }
};

// OTTIENE UN RISTORANTE PER ID
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('menu.meal')
      .populate('orders');

    if (!restaurant) return res.status(404).json({ message: 'Ristorante non trovato' });
    res.json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nel recupero del ristorante' });
  }
};

// AGGIORNA UN RISTORANTE
exports.updateRestaurant = async (req, res) => {
  try {
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedRestaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    res.json(updatedRestaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nell\'aggiornamento del ristorante' });
  }
};

// ELIMINA UN RISTORANTE
exports.deleteRestaurant = async (req, res) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(req.params.id);

    if (!deletedRestaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    res.json({ message: 'Ristorante eliminato correttamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nell\'eliminazione del ristorante' });
  }
};


// AGGIUNGI UN PIATTO AL MENU
exports.addMenuItem = async (req, res) => {
  try {
    const { ItemId, price, visible } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    restaurant.menu.push({ meal:ItemId, price, visible });
    await restaurant.save();
    res.json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nell\'aggiunta del piatto al menu' });
  }
};

// OTTIENI TUTTI I PIATTI DEL MENU
exports.getMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('menu.meal');
    if (!restaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    res.json(restaurant.menu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nel recupero del menu' });
  }
};

// MODIFICA UN PIATTO DEL MENU
exports.updateMenuItem = async (req, res) => {
  try {
    const { ItemId, price, visible } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    const menuItem = restaurant.menu.find(entry => String(entry.meal._id) === String(ItemId));
    if (!menuItem) return res.status(404).json({ message: 'Piatto non trovato' });

    if (ItemId !== undefined) menuItem.meal = ItemId;
    if (price !== undefined) menuItem.price = price;
    if (visible !== undefined) menuItem.visible = visible;

    await restaurant.save();
    res.json(menuItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nella modifica del piatto' });
  }
};

// ELIMINA UN PIATTO DAL MENU
exports.deleteMenuItem = async (req, res) => {
  try {
    const  menuItemId  = req.params.ItemId;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    const menuItem = restaurant.menu.find(entry => String(entry.meal._id) === String(menuItemId));
    if (!menuItem) return res.status(404).json({ message: 'Piatto non trovato' });

    restaurant.menu = restaurant.menu.filter(entry => String(entry.meal._id) !== String(menuItemId));
    await restaurant.save();
    res.json({ message: 'Piatto eliminato dal menu' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nell\'eliminazione del piatto' });
  }
};




// CREA UN NUOVO ORDINE
exports.createOrder = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    const order = { _id: String(req.body.orderId) };
    restaurant.orders.push(order);
    await restaurant.save();
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nella creazione dell\'ordine' });
  }
};

// OTTIENI TUTTI GLI ORDINI DI UN RISTORANTE
exports.getAllOrders = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate({
        path: 'orders',
        populate: [
          { path: 'items.meal' },
          { path: 'client' }
        ]
      });
    if (!restaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    res.json(restaurant.orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nel recupero degli ordini' });
  }
};

// OTTIENI UN ORDINE SPECIFICO
exports.getOrderById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate("orders").populate('orders.items.meal').populate('orders.client');
    if (!restaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    const order = restaurant.orders.id(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Ordine non trovato' });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nel recupero dell\'ordine' });
  }
};

// AGGIORNA UN ORDINE
exports.updateOrder = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    const order = restaurant.orders.id(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Ordine non trovato' });

    order = { ...order, ...req.body };
    await restaurant.save();
    res.json(order);
    await restaurant.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nell\'aggiornamento dell\'ordine' });
  }
};

// ELIMINA UN ORDINE
exports.deleteOrder = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Ristorante non trovato' });

    const order = restaurant.orders.id(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Ordine non trovato' });

    order.remove();
    await restaurant.save();
    res.json({ message: 'Ordine eliminato correttamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nell\'eliminazione dell\'ordine' });
  }
};