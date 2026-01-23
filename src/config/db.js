const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log(path.resolve(__dirname, '../../.env'))
    await mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.8qtsvhw.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`);
    console.log('MongoDB connesso');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;