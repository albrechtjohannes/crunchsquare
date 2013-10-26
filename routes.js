var request = require('request');
var token = "";

module.exports = function (app, config) {

  function createUrl(baseUrl, params) {
    params = params || {};
    var url = baseUrl + "?";
    for (var attr in params) {
      url += attr + "=" + params[attr] + "&";
    }
    if (token) {
      url += "oauth_token" + "=" + token + "&";
    }
    url += "v=20131116";
    console.log(url);
    console.log("-");
    return url;
  }

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.get('/login', function (req, res) {
    var params = {
      "client_id": config.clientId,
      "response_type": "code",
      "redirect_uri": config.redirectUrl
    };
    var authenticateUrl = createUrl("https://foursquare.com/oauth2/authenticate", params);
    res.writeHead(303, {'location': authenticateUrl });
    res.send();
  });

  app.get('/auth', function (req, res) {
    var params = {
      "client_id": config.clientId,
      "client_secret": config.clientSecret,
      "grant_type": "authorization_code",
      "redirect_uri": config.redirectUrl,
      "code": req.query.code
    };
    var accessTokenUrl = createUrl("https://foursquare.com/oauth2/access_token", params);
    request(accessTokenUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        token = result.access_token;
        res.redirect("/");
      }
    });
  });

  app.get('/friends', function (req, res) {
    var friendsUrl = createUrl("https://api.foursquare.com/v2/users/self");
    request(friendsUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        res.send(body);
      }
    });
  });

  // Airport 4bf58dd8d48988d1ed931735
  app.get('/category', function (req, res) {
    var categoriesUrl = createUrl("https://api.foursquare.com/v2/venues/categories");
    request(categoriesUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        res.send(body);
      }
    });
  });

  app.get('/venue', function (req, res) {
    var params = {
      "ll": req.query.lat + "," + req.query.lng,
      "categoryId": "4bf58dd8d48988d1fa931735"
    };
    var venueUrl = createUrl("https://api.foursquare.com/v2/venues/search", params);
    request(venueUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        // var result = body.response.venues;
        // console.log(result);
        res.send(result);
      }
    });
  });
    
  var models= require('./models.js');
  app.post('/saveCheckIn', function(req, res) {
    var from = req.body.fromDate.split('/');
    if (req.param('toDate')) {
        var to = req.body.toDate.split('/');
        var newCheckIn = new models.PreCheckIn({
            userId: req.body.userId,
            venueId: req.body.venueId,
            fromDate: new Date(from[0], from[1], from[2], from[3], from[4], '00'),
            toDate: new Date(to[0],to[1], to[2], to[3], to[4], '00'),
        })}
    else {
        var newCheckIn = new models.PreCheckIn({
            userId: req.body.userId,
            venueId: req.body.venueId,
            fromDate: new Date(from[0], from[1], from[2], from[3], from[4], '00'),
        })}
    newCheckIn.save(function(err) {
        if (err) {console.log(err);}
        else {return res;}
        }
    );
  });

  app.get('/findOne', function(req, res) {
      models.PreCheckIn.find({ venueId: 456 }).exec(function(err, checkin) {
        console.log(err);
        console.log(checkin);
        });
      })
};
