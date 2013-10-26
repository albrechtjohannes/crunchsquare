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
    res.send("Hallo");
  });

  app.get('/login', function (req, res) {
    res.writeHead(303, {'location': foursquare.getAuthClientRedirectUrl() });
    res.end();
  });

  app.get('/friends', function (req, res) {
    // foursquare.getFriends()
    res.send('Friends');
  });
};