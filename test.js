var request = require('request');

request({
      method: 'POST',
        uri: 'http://localhost:5000/saveCheckIn',
          body: {'userId': 'XYZ123', 
                'fromDate': '13/01/15/14/30',
                'toDate': '13/01/22/14/30',
                'venueId': '123'
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
        console.log(body);
});

request({
      method: 'POST',
        uri: 'http://localhost:5000/saveCheckIn',
          body: {'userId': 'XYZ123', 
                'fromDate': '13/01/15/14/30',
                'venueId': '456'
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
        console.log(body);
});

request({
      method: 'GET',
        uri: 'http://localhost:5000/findOne',
          body: {
                'venueId': 456
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
        console.log(body);
});
