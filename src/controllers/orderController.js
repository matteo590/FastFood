const Order = require('../models/Orders');;

// Creazione ordine
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Ottenere tutti gli ordini
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("client").populate("items.meal").populate("restaurant");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ottenere un ordine per ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("client").populate("items.meal").populate("restaurant");
    if (!order) return res.status(404).json({ error: "Ordine non trovato" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Aggiornare ordine
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Ordine non trovato" });

    Object.assign(order, req.body);
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminare ordine
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: "Ordine non trovato" });
    res.json({ message: "Ordine eliminato" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ottenere ordini per ID utente
exports.getOrdersByUserId = async (req, res) => {
  try {
    const orders = await Order.find({ client: req.params.userId })
      .populate("client")
      .populate("items.meal")
      .populate({
      path: "restaurant",
      populate: { path: "orders" }
      });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
