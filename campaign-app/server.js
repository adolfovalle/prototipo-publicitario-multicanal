const express = require('express');
const bodyParser = require('body-parser');

// create express app
const app = express();
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())


// Configuring the database
const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose.connect(dbConfig.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true 
}).then(() => {
    console.log("Successfully connected to the database");    
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

// define a simple route
app.get('/', (req, res) => {
    res.sendFile( __dirname + "/public/" + "index.html" );
});
app.get('/firebase-messaging-sw.js', (req, res) => {
  res.sendFile( __dirname + "/public/" + "firebase-messaging-sw.js" );
});
app.use('/public', express.static('public'));

//  require routes
require('./app/routes/campaign.routes.js')(app);
require('./app/routes/audience.routes.js')(app);

// listen for requests
app.listen(3000, () => {
    console.log("Server is listening on port 3000");
    //saveMessagingDeviceToken();
});