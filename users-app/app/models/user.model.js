const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    token: String,
    email: String,
    interests: Array,
    disponible: Boolean,
    fechaPush: Date,
    fechaEmail: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);