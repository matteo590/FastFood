const bcrypt = require("bcrypt"); // password hashate
const User = require("../models/Users"); // importa il model utente

/**
 * validateLogin
 * Riceve req.body con { email, pass }
 * Controlla se esiste un utente con quell'email
 * e se la password combacia
 */


// helper: validazioni base
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}
const ALLOWED_USER_TYPES = new Set(["ristoratore", "cliente"]);
const ALLOWED_PAYMENT = new Set(["carta", "bancomat", "paypal"]);


exports.validateSignup = async (req, res) => {
  const {
    firstname,
    lastname,
    birthday,       // es. "2000-05-20"
    paymentMethod,   // "carta" | "bancomat" | "paypal"
    email,
    userType,       // "ristoratore" | "cliente"
    pass
  } = req.body;

  if (!firstname || !lastname || !email || !pass ||  !paymentMethod || !birthday || !userType) {

    return res.status(400).json({ message: "Tutti i campi obbligatori devono essere compilati." });
    
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Email non valida." });
  }
  if (pass.length < 8) {
    return res.status(400).json({ message: "La password deve avere almeno 8 caratteri." });
  }
  if (!ALLOWED_USER_TYPES.has(userType)) {
    return res.status(400).json({ message: "Tipo utente non valido." });
  }
  if (!ALLOWED_PAYMENT.has(paymentMethod)) {
    return res.status(400).json({ message: "Metodo di pagamento non valido." });
  }

  if (!birthday) {
    return res.status(400).json({ message: "La data di nascita è obbligatoria." });
  }
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) {
    return res.status(400).json({ message: "Data di nascita non valida." });
  }
  if (new Date() < new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate())) {
    return res.status(400).json({ message: "Non sei maggiorenne" });
  }


  const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (existing) {
    return res.status(409).json({ message: "Email già registrata." });
  }

  const passwordHash = await bcrypt.hash(pass, 10);
  //const passwordHash = pass; // PER TESTING SENZA BCRYPT

  const user = await User.create({
    name: firstname.trim(),
    surname: lastname.trim(),
    birthday: birth,
    role: userType,
    payment: paymentMethod,
    email: email.toLowerCase().trim(),
    password: passwordHash,
  });

  return res.status(201).json({
    message: "Registrazione avvenuta con successo",
    user: {
      id: user._id,
      name: user.name,
      surname: user.surname,
      role: user.role,
      payment: user.payment,
      email: user.email,
    },
  });
};


exports.validateLogin = async (req, res) => {
  try {



    // login
    const { email, pass } = req.body;

    // Controllo campi
    if (!email || !pass) {
      return res.status(400).json({ message: "Email e password sono obbligatorie" });
    }

    // Cerca utente nel DB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    // Confronta password (hash con bcrypt)
    const isValid = await bcrypt.compare(pass, user.password);
    //const isValid = pass === user.password; // PER TESTING SENZA BCRYPT
    if (!isValid) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }


    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.firstname,
        surname: user.lastname,
        role: user.userType,
        payment: user.paymentMethod,
        email: user.email,
      },
    });

  } catch (error) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Email già registrata." });
    }
    console.error(error);
    return res.status(500).json({ message: "Errore del server", error: error.message });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = { ...req.body };
    const allowedFields = [
      "firstname",
      "lastname",
      "birthday",
      "paymentMethod",
      "email",
      "pass"
    ];

    // Remove fields not allowed to be updated
    Object.keys(updates).forEach((key) => {
      if (!allowedFields.includes(key) && key !== "current_psw") {
        delete updates[key];
      }
    });

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato." });
    }
    // If password is being updated
    if (updates.pass) {
      if (!updates.current_psw) {
        return res.status(400).json({ message: "La password attuale è richiesta per modificare la password." });
      }
      const isMatch = await bcrypt.compare(updates.current_psw, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "La password attuale non è corretta." });
      }
      if (updates.pass.length < 8) {
        return res.status(400).json({ message: "La nuova password deve avere almeno 8 caratteri." });
      }
      updates.password = await bcrypt.hash(updates.pass, 10);
      delete updates.pass;
      delete updates.current_psw;
    }

    // Update other fields
    if (updates.firstname) user.name = updates.firstname.trim();
    if (updates.lastname) user.surname = updates.lastname.trim();
    if (updates.birthday) {
      const birth = new Date(updates.birthday);
      if (Number.isNaN(birth.getTime())) {
        return res.status(400).json({ message: "Data di nascita non valida." });
      }
      user.birthday = birth;
    }
    if (updates.userType) {
      if (!ALLOWED_USER_TYPES.has(updates.userType)) {
        return res.status(400).json({ message: "Tipo utente non valido." });
      }
      user.role = updates.userType;
    }
    if (updates.paymentMethod) {
      if (!ALLOWED_PAYMENT.has(updates.paymentMethod)) {
        return res.status(400).json({ message: "Metodo di pagamento non valido." });
      }
      user.payment = updates.paymentMethod;
    }
    if (updates.email) {
      if (!isValidEmail(updates.email)) {
        return res.status(400).json({ message: "Email non valida." });
      }
      const existing = await User.findOne({ email: updates.email.toLowerCase().trim(), _id: { $ne: userId } });
      if (existing) {
        return res.status(409).json({ message: "Email già registrata." });
      }
      user.email = updates.email.toLowerCase().trim();
    }
    if (updates.password) {
      user.password = updates.password;
    }

    await user.save();

    return res.status(200).json({
      message: "Utente aggiornato con successo.",
      user: {
        id: user._id,
        name: user.firstname,
        surname: user.lastname,
        role: user.role,
        payment: user.payment,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server", error: error.message });
  }
};