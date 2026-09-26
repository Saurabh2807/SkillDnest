const express = require("express");

const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


// 1. CREATE PAYMENT
router.post("/", protect, async (req, res) => {
    try {
        const {
            bookingId,
            paymentMethod
        } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                message: "Booking ID is required"
            });
        }

        // Find customer profile from logged-in user
        const customer = await Customer.findOne({
            userId: req.user.id
        });

        if (!customer) {
            return res.status(404).json({
                message: "Customer profile not found"
            });
        }

        // Find booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        // Make sure booking belongs to logged-in customer
        if (
            booking.customerId.toString() !==
            customer._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only make payment for your own booking"
            });
        }

        // Payment only after completed booking
        if (booking.status !== "Completed") {
            return res.status(400).json({
                message:
                    "Payment can only be created after booking is completed"
            });
        }

        // Check existing payment
        const existingPayment = await Payment.findOne({
            bookingId
        });

        if (existingPayment) {
            return res.status(400).json({
                message:
                    "Payment already exists for this booking",
                payment: existingPayment
            });
        }

        const payment = await Payment.create({
            bookingId: booking._id,
            customerId: booking.customerId,
            workerId: booking.workerId,
            amount: booking.amount,
            paymentMethod:
                paymentMethod || "Online",
            paymentStatus: "Pending"
        });

        res.status(201).json({
            message: "Payment created successfully",
            payment
        });

    } catch (error) {
        res.status(500).json({
            message: "Error creating payment",
            error: error.message
        });
    }
});


// 2. MARK PAYMENT AS PAID
router.patch("/:id/pay", protect, async (req, res) => {
    try {

        const payment = await Payment.findById(
            req.params.id
        );

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        const customer = await Customer.findOne({
            userId: req.user.id
        });

        if (!customer) {
            return res.status(404).json({
                message: "Customer profile not found"
            });
        }

        if (
            payment.customerId.toString() !==
            customer._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only pay for your own booking"
            });
        }

        if (payment.paymentStatus === "Paid") {
            return res.status(400).json({
                message: "Payment is already completed"
            });
        }

        payment.paymentStatus = "Paid";

        payment.transactionId =
            "DEMO-" + Date.now();

        await payment.save();

        res.status(200).json({
            message: "Payment completed successfully",
            payment
        });

    } catch (error) {
        res.status(500).json({
            message:
                "Error completing payment",
            error: error.message
        });
    }
});


// 3. GET MY PAYMENTS
router.get("/my", protect, async (req, res) => {
    try {

        const customer = await Customer.findOne({
            userId: req.user.id
        });

        if (!customer) {
            return res.status(404).json({
                message: "Customer profile not found"
            });
        }

        const payments = await Payment.find({
            customerId: customer._id
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            count: payments.length,
            payments
        });

    } catch (error) {
        res.status(500).json({
            message:
                "Error fetching payments",
            error: error.message
        });
    }
});


// 4. WORKER EARNINGS
router.get(
    "/worker/:workerId",
    protect,
    async (req, res) => {
        try {

            const worker = await Worker.findOne({
                _id: req.params.workerId,
                userId: req.user.id
            });

            if (!worker) {
                return res.status(403).json({
                    message:
                        "You can only view your own earnings"
                });
            }

            const payments = await Payment.find({
                workerId: worker._id,
                paymentStatus: "Paid"
            });

            const totalEarnings =
                payments.reduce(
                    (total, payment) =>
                        total + payment.amount,
                    0
                );

            res.status(200).json({
                workerId: worker._id,
                paidBookings: payments.length,
                totalEarnings
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error fetching worker earnings",
                error: error.message
            });
        }
    }
);


module.exports = router;