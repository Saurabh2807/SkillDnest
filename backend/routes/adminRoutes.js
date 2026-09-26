const express = require("express");

const Worker = require("../models/Worker");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const Cooperative = require("../models/Cooperative");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// ADMIN DASHBOARD
// ==========================================

router.get(
    "/dashboard",
    protect,
    allowRoles("CooperativeAdmin"),
    async (req, res) => {
        try {

            // Total workers
            const totalWorkers = await Worker.countDocuments();

            // Verified workers
            const verifiedWorkers =
                await Worker.countDocuments({
                    verificationStatus: "Verified"
                });

            // Pending workers
            const pendingWorkers =
                await Worker.countDocuments({
                    verificationStatus: "Pending"
                });

            // Available workers
            const availableWorkers =
                await Worker.countDocuments({
                    availability: true,
                    verificationStatus: "Verified"
                });

            // Total bookings
            const totalBookings =
                await Booking.countDocuments();

            // Completed bookings
            const completedBookings =
                await Booking.countDocuments({
                    status: "Completed"
                });

            // Pending bookings
            const pendingBookings =
                await Booking.countDocuments({
                    status: "Pending"
                });

            // Accepted bookings
            const acceptedBookings =
                await Booking.countDocuments({
                    status: "Accepted"
                });

            // Total payments
            const totalPayments =
                await Payment.countDocuments();

            // Paid payments
            const paidPayments =
                await Payment.find({
                    paymentStatus: "Paid"
                });

            // Total platform transaction amount
            const totalRevenue =
                paidPayments.reduce(
                    (total, payment) =>
                        total + payment.amount,
                    0
                );

            // Total reviews
            const totalReviews =
                await Review.countDocuments();

            // Average worker rating
            const ratingData =
                await Worker.aggregate([
                    {
                        $match: {
                            rating: { $gt: 0 }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            averageRating: {
                                $avg: "$rating"
                            }
                        }
                    }
                ]);

            const averageRating =
                ratingData.length > 0
                    ? Number(
                          ratingData[0]
                              .averageRating
                              .toFixed(1)
                      )
                    : 0;

            // Total cooperatives
            const totalCooperatives =
                await Cooperative.countDocuments();

            // Verified cooperatives
            const verifiedCooperatives =
                await Cooperative.countDocuments({
                    verificationStatus: "Verified"
                });

            // Final dashboard response
            res.status(200).json({

                message:
                    "Admin dashboard data fetched successfully",

                workers: {
                    total: totalWorkers,
                    verified: verifiedWorkers,
                    pending: pendingWorkers,
                    available: availableWorkers
                },

                bookings: {
                    total: totalBookings,
                    pending: pendingBookings,
                    accepted: acceptedBookings,
                    completed: completedBookings
                },

                payments: {
                    totalPayments,
                    paidPayments:
                        paidPayments.length,
                    totalRevenue
                },

                reviews: {
                    total: totalReviews,
                    averageRating
                },

                cooperatives: {
                    total: totalCooperatives,
                    verified: verifiedCooperatives
                }
            });

        } catch (error) {

            res.status(500).json({
                message:
                    "Error fetching admin dashboard",
                error: error.message
            });

        }
    }
);


module.exports = router;