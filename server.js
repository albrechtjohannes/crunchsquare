var express = require('express'),
    jade = require('jade'),
    http = require('http'),
    OAuth = require('oauth').OAuth,
    OAuth2 = require('oauth').OAuth2;

var app = express();

var config = {
    secret: 'asdjkasjdaijiwuedisadjk',
    oauthXing: {
        requestUrl: 'https://api.xing.com/v1/request_token',
        accessUrl: 'https://api.xing.com/v1/access_token',
        consumerKey: '66a1da2f06ffdafbf79a',
        consumerSecret: '13824ff0c12c83db17d62029cc3e51eb0ff8d8f6',
        authorize_callback: (process.env.PORT) ? 'http://precheckin.herokuapp.com/auth' : 'http://localhost:5000/auth', // http://localhost:5000/auth http://precheckin.herokuapp.com/auth
        version: '1.0',
        signatureMethod: 'HMAC-SHA1'
    },
    oauthFoursquare: {
        clientId: 'PSK5SC5EPW2DJ2CA5OQI5CBFMMFOH3UGKZZ0IEBQLEIYNVOW',
        clientSecret: 'QVYG524JV02VUJTYLFC2CAIO5W544R30XCRESYB04NN0GYKE'
    }
};

// Configure server
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.cookieParser(config.secret));
    app.use(express.session({ cookie: {maxAge: 86400000 }, secret: config.secret}));
    // app.use(express.logger());
    app.use(express.methodOverride());
    app.use(app.router);
    app.locals.pretty = true;
    //Show all errors in development
    // app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

// MongoDB
var mongoUri = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/precheckin';

// Setup routes
require("./routes")(app, config, OAuth, mongoUri);

function startKeepAlive() {
    setInterval(function() {
        var options = {
            host: 'precheckin.herokuapp.com',
            port: 80,
            path: '/'
        };
        http.get(options, function(res) {
            res.on('data', function(chunk) {
                try {
                    // optional logging... disable after it's working
                    // console.log("HEROKU RESPONSE: " + chunk);
                } catch (err) {
                    console.log(err.message);
                }
            });
        }).on('error', function(err) {
            console.log("Error: " + err.message);
        });
    }, 60 * 30 * 1000); // load every 30 minutes
}

startKeepAlive();

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});