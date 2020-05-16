const Audience = require('../models/audience.model.js');

// Create and Save a new audience
exports.create = (req, res) => {
    // // Validate request
    // if(!req.body.any) {
    //     return res.status(400).send({
    //         message: "audience content can not be empty"
    //     });
    // }

    // Create a audience
    const audience = new Audience({
        name: req.body.name || "Unnamed audience",     
        filters: req.body.filters
    });

    // Save audience in the database
    audience.save()
    .then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while creating the audience."
        });
    });
};

// Retrieve and return all audiences from the database.
exports.findAll = (req, res) => {
    Audience.find()
    .then(audiences => {
        res.send(audiences);
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving audiences."
        });
    });
};

// Find a single audience with a audienceId
exports.findOne = (req, res) => {
    Audience.findById(req.params.audienceId)
    .then(audience => {
        if(!audience) {
            return res.status(404).send({
                message: "audience not found with id " + req.params.audienceId
            });            
        }
        res.send(audience);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "audience not found with id " + req.params.audienceId
            });                
        }
        return res.status(500).send({
            message: "Error retrieving audience with id " + req.params.audienceId
        });
    });
};

// Update a audience identified by the audienceId in the request
exports.update = (req, res) => {
//  // Validate Request
//     if(!req.body.content) {
//         return res.status(400).send({
//             message: "audience content can not be empty"
//         });
//     }

    // Find audience and update it with the request body
    Audience.findByIdAndUpdate(req.params.audienceId, {
        nanme: req.body.nanme || "Unnanmed audience",
        filters: req.body.filters
    }, {new: true})
    .then(audience => {
        if(!audience) {
            return res.status(404).send({
                message: "audience not found with id " + req.params.audienceId
            });
        }
        res.send(audience);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "audience not found with id " + req.params.audienceId
            });                
        }
        return res.status(500).send({
            message: "Error updating audience with id " + req.params.audienceId
        });
    });
};

// Delete a audience with the specified audienceId in the request
exports.delete = (req, res) => {
    Audience.findByIdAndRemove(req.params.audienceId)
    .then(audience => {
        if(!audience) {
            return res.status(404).send({
                message: "audience not found with id " + req.params.audienceId
            });
        }
        res.send({message: "audience deleted successfully!"});
    }).catch(err => {
        if(err.kind === 'ObjectId' || err.name === 'NotFound') {
            return res.status(404).send({
                message: "audience not found with id " + req.params.audienceId
            });                
        }
        return res.status(500).send({
            message: "Could not delete audience with id " + req.params.audienceId
        });
    });
};