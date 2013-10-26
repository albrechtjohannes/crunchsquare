module.exports = function (app, foursquare) {

  app.get('/', function (req, res) {
    res.send("Hallo");
  });

  app.get('/login', function (req, res) {
    res.writeHead(303, {'location': foursquare.getAuthClientRedirectUrl() });
    res.end();
  });

  app.get('/callback', function (req, res) {
    foursquare.getAccessToken({
      code: req.query.code
    }, function (error, accessToken) {
      if(error) {
        res.send('An error was thrown: ' + error.message);
      }
      else {
        redirect('/');
      }
    });
  });

  // API
  app.get('/chat', function (req, res) {
    res.send('Chat is running');
  });
  // app.get('/chat/message', api.getMessages);
  // app.post('/chat/message', api.postMessage);
  // app.get('/api/notes/:id', api.getNote);
  // app.put('/api/notes/:id', api.updateNote);
  // app.delete('/api/notes/:id', api.deleteNote);

};