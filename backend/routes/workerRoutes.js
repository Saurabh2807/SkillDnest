const express = require("express");

const Worker = require("../models/Worker");
const Booking = require("../models/Booking");
const User = require("../models/User");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// ADD WORKER
// CooperativeAdmin only
// ======================================================
router.post(
    "/",
    protect,
    allowRoles("CooperativeAdmin"),
    async (req, res) => {
        try {
            const worker = await Worker.create(req.body);

            res.status(201).json({
                message: "Worker added successfully",
                worker
            });
        } catch (error) {
            res.status(500).json({
                message: "Error adding worker",
                error: error.message
            });
        }
    }
);

// ======================================================
// GET ALL WORKERS
// Logged-in users only
// ======================================================
router.get("/", protect, async (req, res) => {
    try {
        const workers = await Worker.find();

        res.status(200).json(workers);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching workers",
            error: error.message
        });
    }
});

// ======================================================
// SEARCH WORKERS
// ======================================================
router.get("/search", async (req, res) => {
    try {
        const { skill, location } = req.query;

        const filter = {};

        if (skill) {
            filter.skills = {
                $regex: skill,
                $options: "i"
            };
        }

        if (location) {
            filter.location = {
                $regex: location,
                $options: "i"
            };
        }

        const workers = await Worker.find(filter);

        res.status(200).json(workers);
    } catch (error) {
        res.status(500).json({
            message: "Error searching workers",
            error: error.message
        });
    }
});

// ======================================================
// FAIR MATCH
// ======================================================
router.get("/fair-match", async (req, res) => {
    try {
        const workers = await Worker.find({
            availability: true,
            verificationStatus: "Verified"
        });

        const workerWorkload = await Promise.all(
            workers.map(async (worker) => {
                const completedBookings =
                    await Booking.countDocuments({
                        workerId: worker._id,
                        status: "Completed"
                    });

                return {
                    worker,
                    completedBookings
                };
            })
        );

        workerWorkload.sort(
            (a, b) =>
                a.completedBookings -
                b.completedBookings
        );

        res.status(200).json(workerWorkload);
    } catch (error) {
        res.status(500).json({
            message: "Error finding fair worker match",
            error: error.message
        });
    }
});

// ======================================================
// NEARBY WORKERS
// ======================================================
router.get("/nearby", async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            radius = 10
        } = req.query;

        if (
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                message:
                    "Latitude and longitude are required"
            });
        }

        const workers = await Worker.find({
            availability: true,
            verificationStatus: "Verified",
            latitude: { $ne: null },
            longitude: { $ne: null }
        });

        const nearbyWorkers =
            workers.filter((worker) => {
                const latDiff =
                    worker.latitude -
                    Number(latitude);

                const lonDiff =
                    worker.longitude -
                    Number(longitude);

                const distance =
                    Math.sqrt(
                        latDiff * latDiff +
                        lonDiff * lonDiff
                    ) * 111;

                return (
                    distance <= Number(radius)
                );
            });

        res.status(200).json({
            count: nearbyWorkers.length,
            workers: nearbyWorkers
        });
    } catch (error) {
        res.status(500).json({
            message:
                "Error finding nearby workers",
            error: error.message
        });
    }
});

// ======================================================
// SMART MATCH
// ======================================================
router.get("/match", async (req, res) => {
    try {
        const { service, location } =
            req.query;

        if (!service) {
            return res.status(400).json({
                message:
                    "Service is required"
            });
        }

        const filter = {
            availability: true,
            verificationStatus: "Verified",
            skills: {
                $regex: service,
                $options: "i"
            }
        };

        if (location) {
            filter.location = {
                $regex: location,
                $options: "i"
            };
        }

        const workers =
            await Worker.find(filter);

        const matchedWorkers =
            await Promise.all(
                workers.map(async (worker) => {
                    const completedBookings =
                        await Booking.countDocuments({
                            workerId: worker._id,
                            status: "Completed"
                        });

                    return {
                        worker,
                        completedBookings
                    };
                })
            );

        matchedWorkers.sort((a, b) => {
            if (
                a.completedBookings !==
                b.completedBookings
            ) {
                return (
                    a.completedBookings -
                    b.completedBookings
                );
            }

            return (
                b.worker.rating -
                a.worker.rating
            );
        });

        res.status(200).json({
            count: matchedWorkers.length,
            service,
            location:
                location || "Any location",
            workers: matchedWorkers
        });
    } catch (error) {
        res.status(500).json({
            message:
                "Error matching workers",
            error: error.message
        });
    }
});

// ======================================================
// OPPORTUNITY SCORE
// ======================================================
router.get(
    "/opportunity-score",
    async (req, res) => {
        try {
            const workers =
                await Worker.find({
                    verificationStatus:
                        "Verified"
                });

            const workerScores =
                await Promise.all(
                    workers.map(
                        async (worker) => {
                            const completedBookings =
                                await Booking.countDocuments(
                                    {
                                        workerId:
                                            worker._id,
                                        status:
                                            "Completed"
                                    }
                                );

                            const workloadScore =
                                Math.max(
                                    0,
                                    40 -
                                        completedBookings *
                                            5
                                );

                            const ratingScore =
                                (worker.rating /
                                    5) *
                                30;

                            const availabilityScore =
                                worker.availability
                                    ? 20
                                    : 0;

                            const experienceScore =
                                Math.min(
                                    worker.experience,
                                    10
                                );

                            const opportunityScore =
                                Math.min(
                                    100,
                                    Math.round(
                                        workloadScore +
                                            ratingScore +
                                            availabilityScore +
                                            experienceScore
                                    )
                                );

                            return {
                                worker: {
                                    id: worker._id,
                                    name: worker.name,
                                    skills:
                                        worker.skills,
                                    experience:
                                        worker.experience,
                                    rating:
                                        worker.rating,
                                    availability:
                                        worker.availability,
                                    location:
                                        worker.location
                                },
                                completedBookings,
                                scores: {
                                    workloadScore,
                                    ratingScore:
                                        Number(
                                            ratingScore.toFixed(
                                                1
                                            )
                                        ),
                                    availabilityScore,
                                    experienceScore
                                },
                                opportunityScore
                            };
                        }
                    )
                );

            workerScores.sort(
                (a, b) =>
                    b.opportunityScore -
                    a.opportunityScore
            );

            res.status(200).json({
                message:
                    "Fair opportunity scores calculated successfully",
                count:
                    workerScores.length,
                workers: workerScores
            });
        } catch (error) {
            res.status(500).json({
                message:
                    "Error calculating opportunity scores",
                error: error.message
            });
        }
    }
);

// ======================================================
// LINK WORKER WITH USER ACCOUNT
// CooperativeAdmin only
// ======================================================
router.patch(
    "/:id/link-user",
    protect,
    allowRoles("CooperativeAdmin"),
    async (req, res) => {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    message:
                        "User ID is required"
                });
            }

            const worker =
                await Worker.findById(
                    req.params.id
                );

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker not found"
                });
            }

            const user =
                await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    message:
                        "User not found"
                });
            }

            if (user.role !== "Worker") {
                return res.status(400).json({
                    message:
                        "User must have Worker role"
                });
            }

            const alreadyLinked =
                await Worker.findOne({
                    userId: user._id,
                    _id: {
                        $ne: worker._id
                    }
                });

            if (alreadyLinked) {
                return res.status(400).json({
                    message:
                        "This user is already linked to another worker"
                });
            }

            worker.userId = user._id;

            await worker.save();

            res.status(200).json({
                message:
                    "Worker linked with user successfully",
                worker
            });
        } catch (error) {
            res.status(500).json({
                message:
                    "Error linking worker with user",
                error: error.message
            });
        }
    }
);

// ======================================================
// UPDATE OWN AVAILABILITY
// Worker only
// ======================================================
router.patch(
    "/:id/availability",
    protect,
    allowRoles("Worker"),
    async (req, res) => {
        try {
            const { availability } =
                req.body;

            if (
                typeof availability !==
                "boolean"
            ) {
                return res.status(400).json({
                    message:
                        "Availability must be true or false"
                });
            }

            const worker =
                await Worker.findOne({
                    _id: req.params.id,
                    userId: req.user.id
                });

            if (!worker) {
                return res.status(403).json({
                    message:
                        "You can only update your own availability"
                });
            }

            worker.availability =
                availability;

            await worker.save();

            res.status(200).json({
                message:
                    "Worker availability updated successfully",
                worker
            });
        } catch (error) {
            res.status(500).json({
                message:
                    "Error updating worker availability",
                error: error.message
            });
        }
    }
);

// ======================================================
// UPDATE OWN LOCATION
// Worker only
// ======================================================
router.patch(
    "/:id/location",
    protect,
    allowRoles("Worker"),
    async (req, res) => {
        try {
            const {
                latitude,
                longitude
            } = req.body;

            if (
                latitude === undefined ||
                longitude === undefined
            ) {
                return res.status(400).json({
                    message:
                        "Latitude and longitude are required"
                });
            }

            if (
                typeof latitude !==
                    "number" ||
                typeof longitude !==
                    "number"
            ) {
                return res.status(400).json({
                    message:
                        "Latitude and longitude must be numbers"
                });
            }

            if (
                latitude < -90 ||
                latitude > 90
            ) {
                return res.status(400).json({
                    message:
                        "Invalid latitude"
                });
            }

            if (
                longitude < -180 ||
                longitude > 180
            ) {
                return res.status(400).json({
                    message:
                        "Invalid longitude"
                });
            }

            const worker =
                await Worker.findOne({
                    _id: req.params.id,
                    userId: req.user.id
                });

            if (!worker) {
                return res.status(403).json({
                    message:
                        "You can only update your own location"
                });
            }

            worker.latitude =
                latitude;
            worker.longitude =
                longitude;

            await worker.save();

            res.status(200).json({
                message:
                    "Worker location updated successfully",
                location: {
                    latitude:
                        worker.latitude,
                    longitude:
                        worker.longitude
                }
            });
        } catch (error) {
            res.status(500).json({
                message:
                    "Error updating worker location",
                error: error.message
            });
        }
    }
);

// ======================================================
// GET SINGLE WORKER
// ======================================================
router.get(
    "/:id",
    async (req, res) => {
        try {
            const worker =
                await Worker.findById(
                    req.params.id
                );

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker not found"
                });
            }

            res.status(200).json(worker);
        } catch (error) {
            res.status(500).json({
                message:
                    "Error fetching worker",
                error: error.message
            });
        }
    }
);

// ======================================================
// UPDATE WORKER
// CooperativeAdmin only
// ======================================================
router.patch(
    "/:id",
    protect,
    allowRoles("CooperativeAdmin"),
    async (req, res) => {
        try {
            const worker =
                await Worker.findByIdAndUpdate(
                    req.params.id,
                    req.body,
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker not found"
                });
            }

            res.status(200).json({
                message:
                    "Worker updated successfully",
                worker
            });
        } catch (error) {
            res.status(500).json({
                message:
                    "Error updating worker",
                error: error.message
            });
        }
    }
);

// ======================================================
// DELETE WORKER
// CooperativeAdmin only
// ======================================================
router.delete(
    "/:id",
    protect,
    allowRoles("CooperativeAdmin"),
    async (req, res) => {
        try {
            const worker =
                await Worker.findByIdAndDelete(
                    req.params.id
                );

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker not found"
                });
            }

            res.status(200).json({
                message:
                    "Worker deleted successfully"
            });
        } catch (error) {
            res.status(500).json({
                message:
                    "Error deleting worker",
                error: error.message
            });
        }
    }
);

// ======================================================
// VERIFY WORKER
// CooperativeAdmin only
// ======================================================
router.patch(
    "/:id/verify",
    protect,
    allowRoles("CooperativeAdmin"),
    async (req, res) => {
        try {
            const worker =
                await Worker.findByIdAndUpdate(
                    req.params.id,
                    {
                        verificationStatus:
                            "Verified"
                    },
                    {
                        new: true
                    }
                );

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker not found"
                });
            }

            res.status(200).json({
                message:
                    "Worker verified successfully",
                worker
            });
        } catch (error) {
            res.status(500).json({
                message:
                    "Error verifying worker",
                error: error.message
            });
        }
    }
);

// ======================================================
// UPDATE RATING
// ======================================================
router.patch(
    "/:id/rating",
    async (req, res) => {
        try {
            const { rating } =
                req.body;

            if (
                rating < 1 ||
                rating > 5
            ) {
                return res.status(400).json({
                    message:
                        "Rating must be between 1 and 5"
                });
            }

            const worker =
                await Worker.findByIdAndUpdate(
                    req.params.id,
                    { rating },
                    { new: true }
                );

            if (!worker) {
                return res.status(404).json({
                    message:
                        "Worker not found"
                });
            }

            res.status(200).json({
                message:
                    "Rating added successfully",
                worker
            });
        } catch (error) {
            res.status(500).json({
                message:
                    "Error adding rating",
                error: error.message
            });
        }
    }
);

module.exports = router;