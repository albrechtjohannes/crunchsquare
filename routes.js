var request = require('request'),
  async = require('async');

module.exports = function (app, config) {

  var token = "";

  app.get('/images/:userid', function(req,res) {
    url = createUrl("https://api.foursquare.com/v2/users/" + req.params.userid);
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        var photoUrl = result.response.user.photo.prefix + '36x36' + result.response.user.photo.suffix;
        console.log(photoUrl);
        res.send(photoUrl);
        }
      }
    );
  });

  function getPhotoUrl(userid) {
    url = createUrl("https://api.foursquare.com/v2/users/" + userid);
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        var photoUrl = result.response.user.photo.prefix + '36x36' + result.response.user.photo.suffix;
        return photoUrl;
        }
      });
  };

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
    res.writeHead(303, { 'location': authenticateUrl });
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
    if (!req.session.userId) { getUserData(req); }

    async.parallel([
      function(callback) {
        if (req.query.fromDate === "Invalid Date") {
          if (req.query.toDate === "Invalid Date") {
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
                callback(null, result.response.venues);
              }
            });
          } else {
            callback(null, []);
          }
        } else {
          if (req.query.toDate === "Invalid Date") {
            callback(null, []);
          } else {
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
                callback(null, result.response.venues);
              }
            });
          }
        }
      },
      function(callback) {
        if (req.query.fromDate !== "Invalid Date" && req.query.toDate !== "Invalid Date") {
          inTimeFrame(req, callback);
        } else {
          callback(null, "");
        }
      }], function(err, results) {
          //console.log(results);
        if (results[1] === "") {
          res.send(results[0]);
        } else {
          var venues = results[0];
          var preCheckins = results[1];
          for (var i = 0; i < venues.length; i++) {
            venues[i].preChecked = [];
            for (var j = 0; j < preCheckins.length; j++) {
              if (venues[i].id === preCheckins[j]._venueId) {
                venues[i].preChecked.push(preCheckins[j]);
              }
            }
          }
          res.send(venues);
          /*console.log(venues[i].preChecked);
          res.send(async.map(venues[i].preChecked, getPhotoUrl, function(err, results) {
            if (!err) {
              venues[i].preCheckedPhotos = results;
              console.log(results);
              return results[0];
              }
            else {console.log(err);}
          }));
          */

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

  app.get('/current', function (req, res) {
    var venueUrl = createUrl("https://api.foursquare.com/v2/checkins/recent");
    request(venueUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body).response.recent;
        var result = {};
        for (var i = 0; i < data.length; i++) {
          var location = data[i].venue.location;
          var distance = getDistance(location.lat, location.lng, req.query.lat, req.query.lng);
          var user = data[i].user;
          if (distance <= 25) {
            if (!(user.id in result))   {
              result[user.id] = {
                userName: user.firstName + " " + user.lastName,
                userPhotoUrl: user.photo.prefix + "36x36" + user.photo.suffix,
                venueName: data[i].venue.name,
                lat: data[i].venue.location.lat,
                lng: data[i].venue.location.lng
              };
            }
          }
        }
        console.log(result);
        res.send(result);
      }
    });
  });

  function getUserData(req) {
    var friendsUrl = createUrl("https://api.foursquare.com/v2/users/self");
    request(friendsUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var user = JSON.parse(body).response.user;
        req.session.userId = user.id;
        req.session.userName = user.firstName + " " + user.lastName;
        req.session.userPhotoUrl  = user.photo.prefix + "36x36" + user.photo.suffix;
      }
    });
  }

  var models= require('./models.js');
  app.post('/new', function(req, res) {
    var toDate = null;
    if (req.param('toDate')) {
      toDate = new Date(req.body.toDate);
    }
    var newCheckIn = new models.PreCheckIn({
      //_userId: req.body.userId,
      _userId: req.session.userId,
      _userPhotoUrl: req.session.userPhotoUrl,
      _userName: req.session.userName,
      _venueId: req.body.venueId,
      _fromDate: new Date(req.body.fromDate),
      _toDate: toDate
    });
    newCheckIn.save(function(err, data) {
      if (err) {
        console.log(err);
        res.json(err);
      } else {
        console.log("Added new CheckIn");
        res.statusCode = 201;
        res.send();
      }
    });
  });

  app.get('/inTimeframe', function(req, res) {
    res.send(inTimeFrame(req, res));
  });

  function inTimeFrame(req, callback) {
    var reqFrom = new Date(req.query.fromDate);
    var reqTo = new Date(req.query.toDate);
    models.PreCheckIn.find()
    .where('_fromDate').lte(reqTo)
    .exec(function(err, data){
      if (err) {console.log(err);}
      else if (data.length === 0) {
        console.log('No entries found.');
      }
      else {
        var result = [];
        for (var i=0; i<data.length; i += 1) {
          if (!("_toDate" in data[i]))
            {result.push(data[i]); console.log('Added: ' + data[i]._fromDate + ' and no end.');}
          else if (data[i]._toDate >= reqFrom) {
            result.push(data[i]); console.log('Added: ' + data[i]._fromDate); console.log(data[i]._toDate);
          }
        }
        if (callback) {
          callback(null, result);
        } else {
          return result;
        }
      }
    });
  }
};
