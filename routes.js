var token;

module.exports = function (app, foursquare) {

  app.get('/', function (req, res) {
    foursquare.getAccessToken({
      code: req.query.code
    }, function (error, accessToken) {
      if(error) {
        res.send('An error was thrown: ' + error.message);
      }
      else {
        token = accessToken;
      }
    });
    res.render('index');
  });

  app.get('/login', function (req, res) {
    res.writeHead(303, {'location': foursquare.getAuthClientRedirectUrl() });
    res.end();
  });


  //
  app.get('/friends', function (req, res) {
    foursquare.Users.getFriends(null, null, token, function(error, result) {
      if (error) {
        res.send('An error was thrown: ' + error.message);
      } else {
        res.send(result);
      }
    });
  });

  app.get('/venue', function (req, res) {
    var lat = req.query.lat;
    var lon = req.query.lng;
    foursquare.Venues.explore(lat, lon, null, token, function(error, result) {
      if (error) {
        res.send('An error was thrown: ' + error.message);
      } else {
        res.send(result);
      }
    });
  });

};