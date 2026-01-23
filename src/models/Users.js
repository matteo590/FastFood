const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    birthday: {type: Date, required: true},
    role: {type: String, enum:['ristoratore', 'cliente'], required: true},
    password:{type: String, required: true},
    payment: {type: String, required: true}
});

module.exports = mongoose.model('User', userSchema);