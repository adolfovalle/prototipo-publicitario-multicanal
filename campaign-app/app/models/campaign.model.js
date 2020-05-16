const mongoose = require('mongoose');

const CampaignSchema = mongoose.Schema({
    title: String,
    channels: Array,
    startdate: Date,
    enddate: Date,
    audience: Object,
    message: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Campaign', CampaignSchema);