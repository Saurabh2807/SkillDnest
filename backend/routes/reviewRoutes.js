const express = require("express");

const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ADD REVIEW
router.post(
    "/",
    protect,
    allowRoles("Customer"),
    async (req, res) => {
        try {
            const {
                bookingId,
                rating,
                comment
            } = req.body;

            if (!bookingId || !rating) {
                return res.status(400).json({
                    message:
                        "Booking ID and rating are required"
                });
            }

            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    message:
                        "Rating must be between 1 and 5"
                });
            }

            // Current logged-in customer
            const customer =
                await Customer.findOne({
                    userId: req.user.id
                });

            if (!customer) {
                return res.status(404).json({
                    message:
                        "Customer profile not found"
                });
            }

            // Find booking
            const booking =
                await Booking.findById(
                    bookingId
                );

            if (!booking) {
                return res.status(404).json({
                    message:
                        "Booking not found"
                });
            }

            // Check booking belongs to customer
            if (
                booking.customerId.toString() !==
                customer._id.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You can only review your own booking"
                });
            }

            // Booking must be completed
            if (
                booking.status !==
                "Completed"
            ) {
                return res.status(400).json({
                    message:
                        "Review can only be added after booking is completed"
                });
            }

            // Check duplicate review
            const existingReview =
                await Review.findOne({
                    bookingId:
                        booking._id
                });

            if (existingReview) {
                return res.status(400).json({
                    message:
                        "Review already submitted for this booking"
                });
            }

            // Create review
            const review =
                await Review.create({
                    customerId:
                        customer._id,
                    workerId:
                        booking.workerId,
                    bookingId:
                        booking._id,
                    rating,
                    comment:
                        comment || ""
                });

            // Recalculate worker average rating
            const reviews =
                await Review.find({
                    workerId:
                        booking.workerId
                });

            const totalRating =
                reviews.reduce(
                    (total, review) =>
                        total + review.rating,
                    0
                );

            const averageRating =
                totalRating /
                reviews.length;

            await Worker.findByIdAndUpdate(
                booking.workerId,
                {
                    rating:
                        Number(
                            averageRating.toFixed(
                                1
                            )
                        )
                }
            );

            res.status(201).json({
                message:
                    "Review added successfully",
                review,
                workerAverageRating:
                    Number(
                        averageRating.toFixed(
                            1
                        )
                    )
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error adding review",
                error:
                    error.message
            });
        }
    }
);


// GET WORKER REVIEWS
router.get(
    "/worker/:workerId",
    async (req, res) => {
        try {
            const reviews =
                await Review.find({
                    workerId:
                        req.params.workerId
                });

            res.status(200).json({
                count:
                    reviews.length,
                reviews
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error fetching reviews",
                error:
                    error.message
            });
        }
    }
);


module.exports = router;