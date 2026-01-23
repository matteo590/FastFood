const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
	name: { type: String, required: true },
	logo: { type: String, required: true },
	category: { type: String, required: true },
	address: { type: String, required: true },
	piva: { type: String, required: true},
	tel: { type: Number },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	menu: [{
		meal: { type: mongoose.Schema.Types.ObjectId, ref: "Meal"},
		visible: { type: Boolean, default: true },
		price: {type: Number, required:true}
	}],
	orders: { type: [mongoose.Schema.Types.ObjectId], ref: "Order", default: [] }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);