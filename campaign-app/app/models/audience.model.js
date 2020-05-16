const mongoose = require('mongoose');

const AudienceSchema = mongoose.Schema({
    name: String,
    filters: Array
}, {
    timestamps: true
});

module.exports = mongoose.model('Audience', AudienceSchema);