module.exports = (app) => {
    const campaigns = require('../controllers/campaign.controller.js');

    // Create a new campaign
    app.post('/campaigns', campaigns.create);

    // Retrieve all campaigns
    app.get('/campaigns', campaigns.findAll);

    // Retrieve a single campaign with campaignId
    app.get('/campaigns/:campaignId', campaigns.findOne);

    // Send message to useres part of the audience of campaign with campaignId
    app.get('/campaigns/send/:campaignId', campaigns.sendCampaign);

    // Update a campaign with campaignId
    app.put('/campaigns/:campaignId', campaigns.update);

    // Delete a campaign with campaignId
    app.delete('/campaigns/:campaignId', campaigns.delete);
}