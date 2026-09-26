const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },

    category: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    active: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model("Service", serviceSchema);