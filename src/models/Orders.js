const mongoose = require('mongoose');
const { type } = require('os');

const OrdersSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  state: { type: String, enum: ["ordered", "preparing", "on the way", "delivered"], required: true },
  price: { type: Number, required: true },
  items: {
    type: [
      {
        meal: { type: mongoose.Schema.Types.ObjectId, ref: "Meal", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
      }],
  },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  expireAt: {
    type: Date,
    index: true
  }

});

OrdersSchema.pre('save', function (next) {
  if (this.isModified('state') && this.state === 'delivered') {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    this.expireAt = new Date(localNow.getTime() + (30 * 24 * 60 * 60 * 1000)); // scade tra 30 giorni in ora locale
    console.debug("ExpireAt set to" + this.expireAt + "for delivered order");
  }
  next();
});

module.exports = mongoose.model('Order', OrdersSchema);