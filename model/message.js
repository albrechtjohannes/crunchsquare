var mongoose = require('mongoose');

var Message = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    userName: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String }
});

module.exports = mongoose.model('Message', Message);
