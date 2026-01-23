const Meal = require("../models/Meals");

// Creazione meal
exports.createMeal = async (req, res) => {
  try {
    const meal = await Meal.create(req.body);
    
    res.status(201).json(meal);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};

// Dettaglio meal per ID
exports.getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id).populate("personalized");
    if (!meal) return res.status(404).json({ message: "Meal non trovato" });
    res.json(meal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Aggiornamento meal
exports.updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!meal) return res.status(404).json({ message: "Meal non trovato" });
    res.json(meal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Eliminazione meal
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    if (!meal) return res.status(404).json({ message: "Meal non trovato" });
    res.json({ message: "Meal eliminato" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Tutti i piatti per un ristorante (default + personalizzati)
exports.getMealsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const meals = await Meal.find({
      $or: [
        { personalized: null },                   // piatti globali
        { personalized: restaurantId }            // piatti personalizzati di quel ristorante
      ]
    }).populate("personalized");

    res.json(meals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

