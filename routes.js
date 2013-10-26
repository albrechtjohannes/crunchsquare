var token;

module.exports = function (app, foursquare) {

  app.get('/', function (req, res) {
    res.send('HER');
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
