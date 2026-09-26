const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true
        },

        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },

        workerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending"
        },

        paymentMethod: {
            type: String,
            enum: ["Cash", "UPI", "Card", "Online"],
            default: "Online"
        },

        transactionId: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);