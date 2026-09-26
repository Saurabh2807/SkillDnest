const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    service: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: "Pending"
    }
});

module.exports = mongoose.model("Booking", bookingSchema);