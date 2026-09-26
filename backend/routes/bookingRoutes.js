const express = require("express");

const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const createNotification = require("../utils/notificationHelper");

const router = express.Router();


// =====================================================
// CREATE BOOKING
// CUSTOMER ONLY
// =====================================================

router.post(
    "/",
    protect,
    allowRoles("Customer"),
    async (req, res) => {
        try {
            const {
                workerId,
                service,
                date,
                time,
                address,
                amount
            } = req.body;

            if (
                !workerId ||
                !service ||
                !date ||
                !time ||
                !address ||
                amount === undefined
            ) {
                return res.status(400).json({
                    message:
                        "Worker, service, date, time, address and amount are required"
                });
            }

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

            const worker =
                await Worker.findById(workerId);

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker not found"
                });
            }

            if (
                worker.verificationStatus !==
                "Verified"
            ) {
                return res.status(400).json({
                    message:
                        "Worker is not verified"
                });
            }

            if (!worker.availability) {
                return res.status(400).json({
                    message:
                        "Worker is currently unavailable"
                });
            }

            // Check same worker, date and time
            const existingBooking =
                await Booking.findOne({
                    workerId: worker._id,
                    date,
                    time,
                    status: {
                        $in: [
                            "Pending",
                            "Accepted"
                        ]
                    }
                });

            if (existingBooking) {
                return res.status(409).json({
                    message:
                        "Worker is already booked for this date and time"
                });
            }

            const booking =
                await Booking.create({
                    customerId:
                        customer._id,
                    workerId:
                        worker._id,
                    service,
                    date,
                    time,
                    address,
                    amount,
                    status: "Pending"
                });

            // Automatic worker notification
            if (worker.userId) {
                await createNotification(
                    worker.userId,
                    `New booking received for ${service} on ${date} at ${time}`,
                    "Booking"
                );
            }

            res.status(201).json({
                message:
                    "Booking created successfully",
                booking
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error creating booking",
                error:
                    error.message
            });
        }
    }
);


// =====================================================
// GET BOOKINGS
// ROLE BASED
// =====================================================

router.get(
    "/",
    protect,
    async (req, res) => {
        try {

            // CUSTOMER
            if (
                req.user.role ===
                "Customer"
            ) {

                const customer =
                    await Customer.findOne({
                        userId:
                            req.user.id
                    });

                if (!customer) {
                    return res.status(404).json({
                        message:
                            "Customer profile not found"
                    });
                }

                const bookings =
                    await Booking.find({
                        customerId:
                            customer._id
                    });

                return res.status(200).json({
                    count:
                        bookings.length,
                    bookings
                });
            }


            // WORKER
            if (
                req.user.role ===
                "Worker"
            ) {

                const worker =
                    await Worker.findOne({
                        userId:
                            req.user.id
                    });

                if (!worker) {
                    return res.status(404).json({
                        message:
                            "Worker profile not found"
                    });
                }

                const bookings =
                    await Booking.find({
                        workerId:
                            worker._id
                    });

                return res.status(200).json({
                    count:
                        bookings.length,
                    bookings
                });
            }


            // COOPERATIVE ADMIN
            if (
                req.user.role ===
                "CooperativeAdmin"
            ) {

                const bookings =
                    await Booking.find();

                return res.status(200).json({
                    count:
                        bookings.length,
                    bookings
                });
            }


            return res.status(403).json({
                message:
                    "Access denied"
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error fetching bookings",
                error:
                    error.message
            });
        }
    }
);


// =====================================================
// GET BOOKING STATUS
// AUTHENTICATED USER
// =====================================================

router.get(
    "/:id/status",
    protect,
    async (req, res) => {
        try {

            const booking =
                await Booking.findById(
                    req.params.id
                );

            if (!booking) {
                return res.status(404).json({
                    message:
                        "Booking not found"
                });
            }

            // Customer ownership check
            if (
                req.user.role ===
                "Customer"
            ) {

                const customer =
                    await Customer.findOne({
                        userId:
                            req.user.id
                    });

                if (
                    !customer ||
                    booking.customerId.toString() !==
                    customer._id.toString()
                ) {
                    return res.status(403).json({
                        message:
                            "You can only view your own booking"
                    });
                }
            }


            // Worker ownership check
            if (
                req.user.role ===
                "Worker"
            ) {

                const worker =
                    await Worker.findOne({
                        userId:
                            req.user.id
                    });

                if (
                    !worker ||
                    booking.workerId.toString() !==
                    worker._id.toString()
                ) {
                    return res.status(403).json({
                        message:
                            "You can only view your assigned booking"
                    });
                }
            }


            res.status(200).json({
                bookingId:
                    booking._id,
                service:
                    booking.service,
                date:
                    booking.date,
                time:
                    booking.time,
                status:
                    booking.status,
                workerId:
                    booking.workerId,
                customerId:
                    booking.customerId
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error fetching booking status",
                error:
                    error.message
            });
        }
    }
);


// =====================================================
// ACCEPT BOOKING
// WORKER ONLY
// =====================================================

router.patch(
    "/:id/accept",
    protect,
    allowRoles("Worker"),
    async (req, res) => {
        try {

            const booking =
                await Booking.findById(
                    req.params.id
                );

            if (!booking) {
                return res.status(404).json({
                    message:
                        "Booking not found"
                });
            }

            const worker =
                await Worker.findOne({
                    userId:
                        req.user.id
                });

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker profile not found"
                });
            }

            if (
                booking.workerId.toString() !==
                worker._id.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this booking"
                });
            }

            if (
                booking.status !==
                "Pending"
            ) {
                return res.status(400).json({
                    message:
                        "Only pending bookings can be accepted"
                });
            }

            booking.status =
                "Accepted";

            await booking.save();

            const customer =
                await Customer.findById(
                    booking.customerId
                );

            if (
                customer &&
                customer.userId
            ) {
                await createNotification(
                    customer.userId,
                    `Your booking for ${booking.service} has been accepted by the worker`,
                    "Booking"
                );
            }

            res.status(200).json({
                message:
                    "Booking accepted successfully",
                booking
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error accepting booking",
                error:
                    error.message
            });
        }
    }
);


// =====================================================
// REJECT BOOKING
// WORKER ONLY
// =====================================================

router.patch(
    "/:id/reject",
    protect,
    allowRoles("Worker"),
    async (req, res) => {
        try {

            const booking =
                await Booking.findById(
                    req.params.id
                );

            if (!booking) {
                return res.status(404).json({
                    message:
                        "Booking not found"
                });
            }

            const worker =
                await Worker.findOne({
                    userId:
                        req.user.id
                });

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker profile not found"
                });
            }

            if (
                booking.workerId.toString() !==
                worker._id.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this booking"
                });
            }

            if (
                booking.status !==
                "Pending"
            ) {
                return res.status(400).json({
                    message:
                        "Only pending bookings can be rejected"
                });
            }

            booking.status =
                "Rejected";

            await booking.save();

            const customer =
                await Customer.findById(
                    booking.customerId
                );

            if (
                customer &&
                customer.userId
            ) {
                await createNotification(
                    customer.userId,
                    `Your booking for ${booking.service} has been rejected by the worker`,
                    "Booking"
                );
            }

            res.status(200).json({
                message:
                    "Booking rejected successfully",
                booking
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error rejecting booking",
                error:
                    error.message
            });
        }
    }
);


// =====================================================
// COMPLETE BOOKING
// WORKER ONLY
// =====================================================

router.patch(
    "/:id/complete",
    protect,
    allowRoles("Worker"),
    async (req, res) => {
        try {

            const booking =
                await Booking.findById(
                    req.params.id
                );

            if (!booking) {
                return res.status(404).json({
                    message:
                        "Booking not found"
                });
            }

            const worker =
                await Worker.findOne({
                    userId:
                        req.user.id
                });

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker profile not found"
                });
            }

            if (
                booking.workerId.toString() !==
                worker._id.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this booking"
                });
            }

            if (
                booking.status !==
                "Accepted"
            ) {
                return res.status(400).json({
                    message:
                        "Only accepted bookings can be completed"
                });
            }

            booking.status =
                "Completed";

            await booking.save();

            const customer =
                await Customer.findById(
                    booking.customerId
                );

            if (
                customer &&
                customer.userId
            ) {
                await createNotification(
                    customer.userId,
                    `Your ${booking.service} booking has been completed successfully`,
                    "Booking"
                );
            }

            res.status(200).json({
                message:
                    "Booking completed successfully",
                booking
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error completing booking",
                error:
                    error.message
            });
        }
    }
);


// =====================================================
// CUSTOMER BOOKINGS
// =====================================================

router.get(
    "/customer/:customerId",
    protect,
    allowRoles("Customer"),
    async (req, res) => {
        try {

            const customer =
                await Customer.findOne({
                    userId:
                        req.user.id
                });

            if (!customer) {
                return res.status(404).json({
                    message:
                        "Customer profile not found"
                });
            }

            if (
                customer._id.toString() !==
                req.params.customerId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You can only view your own bookings"
                });
            }

            const bookings =
                await Booking.find({
                    customerId:
                        customer._id
                });

            res.status(200).json({
                count:
                    bookings.length,
                bookings
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error fetching customer bookings",
                error:
                    error.message
            });
        }
    }
);


// =====================================================
// WORKER BOOKINGS
// =====================================================

router.get(
    "/worker/:workerId",
    protect,
    allowRoles("Worker"),
    async (req, res) => {
        try {

            const worker =
                await Worker.findOne({
                    userId:
                        req.user.id
                });

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker profile not found"
                });
            }

            if (
                worker._id.toString() !==
                req.params.workerId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You can only view your own bookings"
                });
            }

            const bookings =
                await Booking.find({
                    workerId:
                        worker._id
                });

            res.status(200).json({
                count:
                    bookings.length,
                bookings
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error fetching worker bookings",
                error:
                    error.message
            });
        }
    }
);


// =====================================================
// WORKER EARNINGS
// =====================================================

router.get(
    "/worker/:workerId/earnings",
    protect,
    allowRoles("Worker"),
    async (req, res) => {
        try {

            const worker =
                await Worker.findOne({
                    userId:
                        req.user.id
                });

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker profile not found"
                });
            }

            if (
                worker._id.toString() !=
                req.params.workerId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You can only view your own earnings"
                });
            }

            const completedBookings =
                await Booking.find({
                    workerId:
                        worker._id,
                    status:
                        "Completed"
                });

            const totalEarnings =
                completedBookings.reduce(
                    (total, booking) =>
                        total +
                        booking.amount,
                    0
                );

            res.status(200).json({
                workerId:
                    worker._id,
                completedBookings:
                    completedBookings.length,
                totalEarnings
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Error fetching worker earnings",
                error:
                    error.message
            });
        }
    }
);


module.exports = router;