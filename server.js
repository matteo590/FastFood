const express = require('express');
const path = require('path');

const restaurantRoutes = require('./src/routes/restaurantsRoute');
const userRoutes = require("./src/routes/usersRoute");
const orderRoutes = require("./src/routes/ordersRoute");
const mealRoutes = require("./src/routes/mealsRoute");
const loginRoutes = require("./src/routes/loginRoute");


require('dotenv').config();
const connectDB = require('./src/config/db'); // importiamo la connessione al DB


// Creiamo l'app Express
const app = express();

// Connettiamo al DB
connectDB();

// Middleware per leggere JSON (se servono API)
app.use(express.json());

//______________________________ROUTES___________________________________________
app.use('/utils/', express.static(path.join(__dirname, "public", "Utils"))); // per servire i file statici in Utils
app.use('/', express.static(path.join(__dirname, 'Public', 'Homepage')))
app.use('/restaurants', express.static(path.join(__dirname, 'Public', 'Ristorante')))
app.use('/login', express.static(path.join(__dirname, 'Public', 'Login')))
app.use('/cart', express.static(path.join(__dirname, 'Public', 'Cart')))
app.use('/dashboard', express.static(path.join(__dirname, 'Public', 'DashRistoratore')))
app.use('/restSettings', express.static(path.join(__dirname, 'Public', 'settingsRistorante')))
app.use('/profile', express.static(path.join(__dirname, 'Public', 'Profile')))
app.use('/orders', express.static(path.join(__dirname, 'Public', 'UserOrders')))
app.use('/stats', express.static(path.join(__dirname, 'Public', 'statsRistorante')))


//______API ROUTES_______________
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use("/api/meals", mealRoutes);

app.use("/api/login", loginRoutes);

// Impostiamo la porta
const PORT = process.env.PORT || 5000;

// Avviamo il server
app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});