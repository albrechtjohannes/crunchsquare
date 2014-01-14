var request = require('request'),
    async = require('async'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID;

module.exports = function (app, config, OAuth, mongoUri) {

    var mongoDB = null;

    MongoClient.connect(mongoUri, function(err, db) {
        if(err) throw err;
        mongoDB = db;

        db.createCollection('checkins', function(err, collection) {
            if (err) {
                console.log('error creating checkins');
            }
        });
        db.createCollection('users', function(err, collection) {
            if (err) {
                console.log('error creating checkins');
            }
        });
    });

    function createUser(req, userId) {
        var usersCollection = mongoDB.collection('users');

        usersCollection.findOne({userId: userId}, function(err, user) {
            if (err) {
                console.log('failed');
            } else {
                if (!user) {
                    var oa = createOAuth(req);
                    var fields = '?fields=display_name,photo_urls';
                    oa.getProtectedResource(
                        'https://api.xing.com/v1/users/me.json' + fields,
                        'GET',
                        req.session.oauth_access_token,
                        req.session.oauth_access_token_secret,
                        function (error, data, response) {
                            var user = JSON.parse(data).users[0];
                            usersCollection.insert({
                                userId: user.id,
                                name: user.display_name,
                                timestamp: new Date(),
                                photo_urls: user.photo_urls
                            }, function(err, docs) {
                                if (err) {
                                    console.log('creation failed');
                                }
                            });
                        }
                    );
                }
            }
        });
    }

    function createCheckin(req, res) {
        var checkinsCollection = mongoDB.collection('checkins'),
            usersCollection = mongoDB.collection('users');

        usersCollection.findOne({userId: req.session.user_id}, function(err, user) {
            if (err) {
                console.log('failed');
            } else {
                checkinsCollection.insert({
                    venueId: req.body.venueId,
                    venueName: req.body.venueName,
                    loc: {
                        lon: req.body.location.lng,
                        lat: req.body.location.lat
                    },
                    userId: req.session.user_id,
                    timestamp: new Date(req.body.date) || new Date(),
                    userName: user.name,
                    photo_urls: user.photo_urls
                }, function(err, docs) {
                    if (err) {
                        console.log('checkin failed');
                    } else {
                        res.send(docs);
                    }
                });
            }
        });
    }

    function deleteCheckin(req, res) {
        var checkinsCollection = mongoDB.collection('checkins');
        checkinsCollection.remove({_id: ObjectID(req.body.id)}, function(err, docs) {
            res.send();
        });
    }

    function findCheckinsByUsers(req, res, userIds, options) {
        var checkinsCollection = mongoDB.collection('checkins');

        checkinsCollection.find({userId: {$in: userIds}, timestamp: {$gte: new Date()}}, {sort: {timestamp: 1}}).toArray(function(err, checkins) {
            if (err) {
                console.log('failed');
            } else {
                if (options.group) {
                    var result = {};
                    for (var i = 0; i < checkins.length; i++) {
                        var checkin = checkins[i];
                        if (checkin.venueId in result) {
                            result[checkin.venueId].userImages.push(checkin.photo_urls.thumb);
                        } else {
                            result[checkin.venueId] = {
                                venueName: checkin.venueName,
                                userImages: [checkin.photo_urls.thumb],
                                loc: checkin.loc
                            };
                        }
                    }
                    res.send(result);
                } else {
                    res.send(checkins);
                }
            }
        });
    }

    function getContactsWithImage(req, res, callback, options) {
        var oa = createOAuth(req);

        var fields = '?user_fields=display_name,photo_urls,id&limit=100';

        oa.getProtectedResource(
            'https://api.xing.com/v1/users/me/contacts.json' + fields,
            'GET',
            req.session.oauth_access_token,
            req.session.oauth_access_token_secret,
            function (error, data, response) {
                var users = JSON.parse(data).contacts.users;
                if (callback) {
                    var userIds = [];
                    for (var i = 0; i < users.length; i++) {
                        userIds.push(users[i].id);
                    }
                    if (options.me) {
                        userIds = [req.session.user_id].concat(userIds);
                    }
                    callback(req, res, userIds, options);
                } else {
                    res.render('contacts', {
                        contacts: users,
                    });
                }
            }
        );
    }

    function getContactsWithId(req, res, callback, options) {
        var oa = createOAuth(req);

        oa.getProtectedResource(
            'https://api.xing.com/v1/users/me/contact_ids.json',
            'GET',
            req.session.oauth_access_token,
            req.session.oauth_access_token_secret,
            function (error, data, response) {
                var userIds = JSON.parse(data).contact_ids.items;
                if (options.me) {
                    userIds = [req.session.user_id].concat(userIds);
                }
                callback(req, res, userIds, options);
            }
        );
    }

    function createOAuth(req) {
        return new OAuth(req.session.oa._requestUrl,
                        req.session.oa._accessUrl,
                        req.session.oa._consumerKey,
                        req.session.oa._consumerSecret,
                        req.session.oa._version,
                        req.session.oa._authorize_callback,
                        req.session.oa._signatureMethod);
    }

    function restrict(req, res, next) {
        if (req.session.oauth_access_token) {
            next();
        } else {
            res.redirect('/hello');
        }
    }

    // ROUTING
    app.get('/', restrict, function (req, res) {
        res.render('index', {
            login: true
        });
    });

    app.get('/hello', function (req, res) {
        res.render('hello', {
          login: false
        });
    });

    app.get('/login', function(req, res) {

        var oa = new OAuth(config.oauthXing.requestUrl,
                          config.oauthXing.accessUrl,
                          config.oauthXing.consumerKey,
                          config.oauthXing.consumerSecret,
                          config.oauthXing.version,
                          config.oauthXing.authorize_callback,
                          config.oauthXing.signatureMethod);

        oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
            if (error) {
                console.log(error);
            } else {
                // store the tokens in the session
                req.session.oa = oa;
                req.session.oauth_token = oauth_token;
                req.session.oauth_token_secret = oauth_token_secret;
                // redirect the user to authorize the token
                res.redirect('https://api.xing.com/v1/authorize?oauth_token=' + oauth_token);
            }
        });
    });

    app.get('/auth', function (req, res) {
        var oa = createOAuth(req);

        oa.getOAuthAccessToken(
            req.session.oauth_token,
            req.session.oauth_token_secret,
            req.param('oauth_verifier'),
            function(error, oauth_access_token, oauth_access_token_secret, results) {
                if (error) {
                    console.log(error);
                } else {
                    // store the access token in the session
                    req.session.oauth_access_token = oauth_access_token;
                    req.session.oauth_access_token_secret = oauth_access_token_secret;
                    req.session.user_id = results.user_id;
                    createUser(req, results.user_id);

                    res.redirect('/');
                }
        });
    });

    app.get('/logout', function(req, res) {
        req.session = null;
        res.redirect('/hello');
    });

    app.get('/map', restrict, function (req, res) {
        res.render('map', {
            login: true
        });
    });

    app.get('/checkins', restrict, function (req, res) {
        res.render('checkins', {
            login: true
        });
    });

    app.get('/contacts', restrict, function (req, res) {
        getContactsWithImage(req, res);
    });

    app.get('/search', function (req, res) {

        if (!req.query.near || !req.query.searchTerm) {
            res.send({});
        }

        var url = 'https://api.foursquare.com/v2/venues/explore?';
        url += 'near=' + req.query.near;
        url += '&query=' + req.query.searchTerm;
        url += '&client_id=' + config.oauthFoursquare.clientId;
        url += '&client_secret=' + config.oauthFoursquare.clientSecret;
        url += '&v=20131116';
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(body).response;
                res.send(result);
            }
        });

        // var url = 'https://api.foursquare.com/v2/venues/search?';
        // url += 'near=' + req.query.near;
        // url += '&query=' + req.query.searchTerm;
        // url += '&intent=match';
        // url += '&client_id=' + config.oauthFoursquare.clientId;
        // url += '&client_secret=' + config.oauthFoursquare.clientSecret;
        // url += '&v=20131116';
        // request(url, function (error, response, body) {
        //     if (!error && response.statusCode == 200) {
        //         var result = JSON.parse(body).response;
        //         res.send(result);
        //     }
        // });
    });

    app.post('/checkin', restrict, function (req, res) {
        if (!req.body.location || !req.body.venueName) {
            console.log('error');
            res.send('');
        } else {
            createCheckin(req, res);
        }
    });

    app.get('/checkin', restrict, function (req, res) {
        var options = {
            group: (req.query.group === "true"),
            me: (req.query.me === "true"),
            friends: (req.query.friends === "true")
        };
        if (options.friends) {
            getContactsWithId(req, res, findCheckinsByUsers, options);
        } else {
            findCheckinsByUsers(req, res, [req.session.user_id], options);
        }
    });

    app.del('/checkin', restrict, function (req, res) {
        deleteCheckin(req, res);
    });

};