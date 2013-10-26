var mongoose = require('mongoose');

var checkInSchema = mongoose.Schema({
    userId: {type: String, required:true},
    venueId: {type: Number, required: true},
    fromDate: {type: Date, required: true},
    toDate: {type: Date}
    });

exports.PreCheckIn = mongoose.model('CheckIn', checkInSchema)
