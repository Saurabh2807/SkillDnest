const Notification = require("../models/Notification");

const createNotification = async (userId, message, type) => {
    try {
        if (!userId) {
            return;
        }

        await Notification.create({
            userId,
            message,
            type: type || "General"
        });

    } catch (error) {
        console.error(
            "Notification creation failed:",
            error.message
        );
    }
};

module.exports = createNotification;