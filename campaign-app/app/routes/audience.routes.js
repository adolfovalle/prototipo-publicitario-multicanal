module.exports = (app) => {
    const audiences = require('../controllers/audience.controller.js');

    // Create a new audience
    app.post('/audiences', audiences.create);

    // Retrieve all audiences
    app.get('/audiences', audiences.findAll);

    // Retrieve a single audience with audienceId
    app.get('/audiences/:audienceId', audiences.findOne);

    // Update a audience with audienceId
    app.put('/audiences/:audienceId', audiences.update);

    // Delete a audience with audienceId
    app.delete('/audiences/:audienceId', audiences.delete);
}