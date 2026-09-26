const express = require("express");

const analyzeServiceRequest =
    require("../utils/aiService");

const protect =
    require("../middleware/authMiddleware");

const router = express.Router();


// AI SERVICE REQUEST ANALYSIS
router.post(
    "/analyze",
    protect,
    async (req, res) => {
        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    message:
                        "Service request message is required"
                });
            }

            const result =
                await analyzeServiceRequest(
                    message
                );

            res.status(200).json({
                message:
                    "Service request analyzed successfully",
                result
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error analyzing service request",
                error:
                    error.message
            });
        }
    }
);


module.exports = router;