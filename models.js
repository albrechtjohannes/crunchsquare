var mongoose = require('mongoose');

var checkInSchema = mongoose.Schema({
    _userId: {type: String, required:true},
    _venueId: {type: Number, required: true},
    _fromDate: {type: Date, required: true},
    _toDate: {type: Date}
    });

exports.PreCheckIn = mongoose.model('CheckIn', checkInSchema);
