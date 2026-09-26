const mongoose = require("mongoose");

const cooperativeSchema = new mongoose.Schema(
    {
        societyName: {
            type: String,
            required: true,
            trim: true
        },

        registrationNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        district: {
            type: String,
            required: true,
            trim: true
        },

        contactPerson: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        // Society photo ka URL
        photo: {
            type: String,
            default: ""
        },

        // Society ke services + sub-services + price
        services: [
            {
                service: {
                    type: String,
                    required: true
                },

                subServices: [
                    {
                        type: String
                    }
                ],

                price: {
                    type: Number,
                    default: 0
                },

                description: {
                    type: String,
                    default: ""
                }
            }
        ],

        verificationStatus: {
            type: String,
            enum: ["Pending", "Verified", "Rejected"],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Cooperative",
    cooperativeSchema
);