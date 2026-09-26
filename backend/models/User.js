const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        email: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["Customer", "Worker", "CooperativeAdmin"],
            default: "Customer"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);