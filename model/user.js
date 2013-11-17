var mongoose = require('mongoose'),
    passportLocalMongoose = require('passport-local-mongoose');

var User = new mongoose.Schema({
    signup_date: {type: Date, default: Date.now}
});

// adds username und password
User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
