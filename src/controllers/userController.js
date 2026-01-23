const User = require('../models/Users');



// Ottenere tutti gli utenti
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    users.forEach(user => {
      user.password = undefined; // Nascondi la password
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ottenere utente per ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Utente non trovato" });
    user.password = undefined; // Nascondi la password
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Eliminare utente
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "Utente non trovato" });
    res.json({ message: "Utente eliminato" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Impostare il ruolo di un utente
exports.setRole = async (req, res) => {
  const { id, role } = req.params;
  const validRoles = ["ristoratore", "cliente"]; // Definisci i ruoli validi
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Ruolo non valido" });
  }
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "Utente non trovato" });
    user.role = role;
    await user.save();
    res.json({ message: "Ruolo aggiornato", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
