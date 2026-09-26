const express = require("express");

const Service = require("../models/Service");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ADD SERVICE — ADMIN ONLY
router.post(
    "/",
    protect,
    allowRoles("CooperativeAdmin"),
    async (req, res) => {
        try {
            const {
                name,
                category,
                description
            } = req.body;

            if (!name || !category) {
                return res.status(400).json({
                    message:
                        "Name and category are required"
                });
            }

            const service =
                await Service.create({
                    name,
                    category,
                    description:
                        description || ""
                });

            res.status(201).json({
                message:
                    "Service added successfully",
                service
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error adding service",
                error: error.message
            });
        }
    }
);


// GET ALL ACTIVE SERVICES — PUBLIC
router.get("/", async (req, res) => {
    try {
        const services =
            await Service.find({
                active: true
            });

        res.status(200).json(services);

    } catch (error) {
        res.status(500).json({
            message:
                "Error fetching services",
            error: error.message
        });
    }
});


// GET SERVICES BY CATEGORY — PUBLIC
router.get(
    "/category/:category",
    async (req, res) => {
        try {
            const services =
                await Service.find({
                    category:
                        req.params.category,
                    active: true
                });

            res.status(200).json(services);

        } catch (error) {
            res.status(500).json({
                message:
                    "Error fetching category services",
                error: error.message
            });
        }
    }
);


module.exports = router;