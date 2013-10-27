var request = require('request');

request({
      method: 'POST',
        uri: 'http://localhost:5000/new',
          body: {'userId': 'XYZ123', 
                'fromDate': "2013-12-15T14:30:00Z",
                'toDate':  "2013-12-21T14:30:00Z",
                'venueId': '123'
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
        console.log(body);
});

request({
      method: 'POST',
        uri: 'http://localhost:5000/new',
          body: {'userId': 'XYZ123', 
                'fromDate': "2013-12-15T14:30:00Z",
                'venueId': '456'
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
        console.log(body);
});

/*request({
      method: 'GET',
        uri: 'http://localhost:5000/findOne',
          body: {
                'venueId': 456
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
        console.log(body);
});*/
