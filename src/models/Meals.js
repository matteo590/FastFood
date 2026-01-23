const mongoose = require('mongoose');

const mealsSchema = new mongoose.Schema({
  idMeal: { type: String},
  strMeal: { type: String, required: true },
  strMealAlternate: { type: String, default: null },
  strCategory: { type: String,required: true, default: null },
  strArea: { type: String, default: null },
  strInstructions: { type: String, default: null },
  strMealThumb: { type: String,required: true, default: null },
  strTags: { type: [String], default: [] },           // array di tag
  strYoutube: { type: String, default: null },
  strSource: { type: String, default: null },
  strImageSource: { type: String, default: null },
  strCreativeCommonsConfirmed: { type: Boolean, default: null },
  dateModified: { type: Date, default: null },
  ingredients: { type: [String],required: true, default: [] },      // array di ingredienti
  measures: { type: [String], default: [] },          // array di misure
  personalized: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", default: null }
});

module.exports = mongoose.model('Meal', mealsSchema);