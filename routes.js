var request = require('request');

module.exports = function (app, config) {

  var token = "";

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
    if (req.session.access_token) {
      res.render('crunch');
    } else {
      res.redirect("/login");
    }
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
        req.session.access_token = result.access_token;
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
        res.send(result.response.user.friends.groups[1].items);
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
      "categoryId": "4eb1bc533b7b2c5b1d4306cb",
      "query": "Lufthansa"
      // "intent": "browse"
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

  function getDistance(lat1,lon1,lat2,lon2) {
    var R = 6371; // km
    var dLat = (lat2-lat1) * Math.PI / 180;
    var dLon = (lon2-lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  Array.prototype.in_array = function (value) {
    return (this.indexOf(value) !== -1);
  };

  Array.prototype.push_unique = function (value) {
    if (!this.in_array(value)) {
      this.push(value);
    }
  };

  app.get('/current', function (req, res) {
    var venueUrl = createUrl("https://api.foursquare.com/v2/checkins/recent");
    request(venueUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body).response.recent;
        var result = [];
        for (var i = 0; i < data.length; i++) {
          var location = data[i].venue.location;
          var distance = getDistance(location.lat, location.lng, req.query.lat, req.query.lng);
          if (distance <= 25) {
            result.push_unique(data[i].user.firstName + " " + data[i].user.lastName);
          }
        }
        res.send(result);
      }
    });
  });

  app.get('/friendsInCity', function (req, res) {
    var venueUrl = createUrl("https://api.foursquare.com/v2/checkins/recent");
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
    var newCheckIn;
    if (req.param('toDate')) {
      var to = req.body.toDate.split('/');
      newCheckIn = new models.PreCheckIn({
        userId: req.body.userId,
        venueId: req.body.venueId,
        fromDate: new Date(from[0], from[1], from[2], from[3], from[4], '00'),
        toDate: new Date(to[0],to[1], to[2], to[3], to[4], '00'),
      });
    } else {
      newCheckIn = new models.PreCheckIn({
        userId: req.body.userId,
        venueId: req.body.venueId,
        fromDate: new Date(from[0], from[1], from[2], from[3], from[4], '00'),
      });
    }
    newCheckIn.save(function(err) {
      if (err) {
        return console.log(err);
      } else {
        return console.log("created");
      }
    });
    res.send(newCheckIn);
  });

  app.get('/findOne', function(req, res) {
    models.PreCheckIn.find({ venueId: 456 }).exec(function(err, checkin) {
        res.send(checkin);
      });
    });
};
