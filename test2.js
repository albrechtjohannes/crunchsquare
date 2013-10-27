var request = require('request');

request({
      method: 'GET',
        uri: 'http://localhost:5000/inTimeframe',
          body: {
                'fromDate': "Mon Dec 16 2013 00:00:00 GMT+0000 (GMT)",
                'toDate': "Wed Dec 18 2013 00:00:00 GMT+0000 (GMT)",
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
});

request({
      method: 'GET',
        uri: 'http://localhost:5000/inTimeframe',
          body: {
                'fromDate': "Mon Dec 09 2013 00:00:00 GMT+0000 (GMT)",
                'toDate': "Wed Dec 18 2013 00:00:00 GMT+0000 (GMT)",
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
});

request({
      method: 'GET',
        uri: 'http://localhost:5000/inTimeframe',
          body: {
                'fromDate': "Mon Dec 16 2013 00:00:00 GMT+0000 (GMT)",
                'toDate': "Wed Dec 25 2013 00:00:00 GMT+0000 (GMT)",
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
});

request({
      method: 'GET',
        uri: 'http://localhost:5000/inTimeframe',
          body: {
                'fromDate': "Mon Dec 09 i2013 00:00:00 GMT+0000 (GMT)",
                'toDate': "Wed Dec 25 2013 00:00:00 GMT+0000 (GMT)",
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
});

request({
      method: 'GET',
        uri: 'http://localhost:5000/inTimeframe',
          body: {
                'fromDate': "Mon Dec 16 2013 00:00:00 GMT+0000 (GMT)",
                'toDate': "Wed Dec 18 2013 00:00:00 GMT+0000 (GMT)",
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
});

request({
      method: 'GET',
        uri: 'http://localhost:5000/inTimeframe',
          body: {
                'fromDate': "Mon Dec 02 2013 00:00:00 GMT+0000 (GMT)",
                'toDate': "Wed Dec 11 2013 00:00:00 GMT+0000 (GMT)",
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
});

request({
      method: 'GET',
        uri: 'http://localhost:5000/inTimeframe',
          body: {
                'fromDate': "Mon Dec 23 2013 00:00:00 GMT+0000 (GMT)",
                'toDate': "Wed Dec 25 2013 00:00:00 GMT+0000 (GMT)",
                },
            json: true
}, function (error, response, body) {
      console.log('code: '+ response.statusCode);
});
