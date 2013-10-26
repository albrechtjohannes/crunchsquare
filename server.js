var application_root = __dirname,
    express = require("express"),
    mongoose = require('mongoose'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    config = { 'secrets':
      {
        'clientId': 'CQ1NUEWBDPBHI3B5DMUST3JVNL4ZHD5ASQ034BYX3L1PCS05',
        'clientSecret': 'PSVCXFSCXG2LSGHQEZ2JS0QPIKRHNFZ3IXWGCP5LW1T3DYBQ',
        'redirectUrl': 'http://localhost:5000/'
      }
    },
    foursquare = require("node-foursquare")(config);

var app = express();

// Configure server
app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

// MongoDB
var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/crunchbase';

mongoose.connect(mongoUri, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + mongoUri + '. ' + err);
  } else {
    console.log ('Succeeded connection to: ' + mongoUri);
  }
});

var options = {
  key: fs.readFileSync('keys/key.pem'),
  cert: fs.readFileSync('keys/cert.pem')
};

// Setup routes
require("./routes")(app, foursquare);

// http.createServer(app).listen(5000);
// https.createServer(options, app).listen(5001);

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});