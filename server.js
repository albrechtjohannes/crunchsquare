var application_root = __dirname,
    express = require("express"),
    mongoose = require('mongoose'),
    config = {
      'clientId': 'PSK5SC5EPW2DJ2CA5OQI5CBFMMFOH3UGKZZ0IEBQLEIYNVOW',
      'clientSecret': 'QVYG524JV02VUJTYLFC2CAIO5W544R30XCRESYB04NN0GYKE',
      'redirectUrl': 'http://localhost:5000/auth'
    };

var app = express();

// Configure server
app.configure(function() {
  app.set('views', __dirname + '/views');
  //app.engine('.html', require('ejs').__express);
  app.set('view engine', 'html');
  app.use(express.static(__dirname + '/views'));
  app.engine('html', require('ejs').renderFile);
  app.use(express.cookieParser());
  app.use(express.session({ cookie: {maxAge: 86400000 }, secret: "keyboard cat"}));
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

// Setup routes
require("./routes")(app, config);

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
