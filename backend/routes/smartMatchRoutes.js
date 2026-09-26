const express = require("express");

const Worker = require("../models/Worker");
const Booking = require("../models/Booking");
const Cooperative = require("../models/Cooperative");

const analyzeServiceRequest =
    require("../utils/aiService");

const protect =
    require("../middleware/authMiddleware");

const allowRoles =
    require("../middleware/roleMiddleware");

const router = express.Router();


// SMART MATCH
router.post(
    "/smart-match",
    protect,
    allowRoles("Customer"),

    async (req, res) => {

        try {

            const { message } = req.body;

            // -----------------------------
            // 1. CHECK CUSTOMER MESSAGE
            // -----------------------------

            if (!message) {

                return res.status(400).json({
                    message:
                        "Service request message is required"
                });

            }


            // -----------------------------
            // 2. GEMINI AI ANALYSIS
            // -----------------------------

            const aiResult =
                await analyzeServiceRequest(message);


            const service =
                aiResult.service || "";

            const location =
                aiResult.location || "";


            // -----------------------------
            // 3. FIND VERIFIED COOPERATIVES
            // -----------------------------

            const cooperativeFilter = {

                verificationStatus:
                    "Verified",

                "services.service": {
                    $regex: service,
                    $options: "i"
                }

            };


            // Location available hai
            // to district match karne ki koshish

            if (location) {

                cooperativeFilter.district = {

                    $regex: location,

                    $options: "i"

                };

            }


            let cooperatives =
                await Cooperative.find(
                    cooperativeFilter
                ).limit(4);


            // -----------------------------
            // 4. LOCATION SE MATCH NA MILE
            // -----------------------------
            // Agar exact district me society
            // nahi mili to service ke basis
            // par 4 societies dikhao.

            if (cooperatives.length === 0) {

                cooperatives =
                    await Cooperative.find({

                        verificationStatus:
                            "Verified",

                        "services.service": {
                            $regex: service,
                            $options: "i"
                        }

                    }).limit(4);

            }


            // -----------------------------
            // 5. SOCIETY DATA + WORKERS
            // -----------------------------

            const cooperativeResults =
                await Promise.all(

                    cooperatives.map(
                        async (cooperative) => {

                            const workers =
                                await Worker.find({

                                    cooperativeId:
                                        cooperative._id,

                                    availability:
                                        true,

                                    verificationStatus:
                                        "Verified",

                                    skills: {
                                        $regex:
                                            service,
                                        $options: "i"
                                    }

                                });


                            // -----------------------------
                            // FAIR OPPORTUNITY
                            // -----------------------------

                            const workersWithBookings =
                                await Promise.all(

                                    workers.map(
                                        async (worker) => {

                                            const completedBookings =
                                                await Booking.countDocuments({

                                                    workerId:
                                                        worker._id,

                                                    status:
                                                        "Completed"

                                                });


                                            return {

                                                worker,

                                                completedBookings

                                            };

                                        }
                                    )

                                );


                            workersWithBookings.sort(
                                (a, b) => {

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

                                }
                            );


                            // -----------------------------
                            // SERVICE PRICE
                            // -----------------------------

                            const matchedService =
                                cooperative.services.find(
                                    (item) =>
                                        item.service
                                            ?.toLowerCase()
                                            .includes(
                                                service.toLowerCase()
                                            )
                                );


                            return {

                                cooperativeId:
                                    cooperative._id,

                                societyName:
                                    cooperative.societyName,

                                registrationNumber:
                                    cooperative.registrationNumber,

                                district:
                                    cooperative.district,

                                contactPerson:
                                    cooperative.contactPerson,

                                phone:
                                    cooperative.phone,

                                photo:
                                    cooperative.photo,

                                verificationStatus:
                                    cooperative.verificationStatus,

                                service:
                                    matchedService
                                        ?.service || service,

                                subServices:
                                    matchedService
                                        ?.subServices || [],

                                price:
                                    matchedService
                                        ?.price || 0,

                                description:
                                    matchedService
                                        ?.description || "",

                                totalWorkers:
                                    workersWithBookings.length,

                                workers:
                                    workersWithBookings.map(
                                        (item) => ({

                                            id:
                                                item.worker._id,

                                            name:
                                                item.worker.name,

                                            photo:
                                                item.worker.photo,

                                            skills:
                                                item.worker.skills,

                                            subServices:
                                                item.worker.subServices,

                                            experience:
                                                item.worker.experience,

                                            rating:
                                                item.worker.rating,

                                            location:
                                                item.worker.location,

                                            availability:
                                                item.worker.availability,

                                            completedBookings:
                                                item.completedBookings

                                        })
                                    )

                            };

                        }

                    )

                );


            // -----------------------------
            // 6. FINAL RESPONSE
            // -----------------------------

            res.status(200).json({

                message:
                    "AI smart cooperative matching successful",

                customerRequest:
                    message,

                aiAnalysis:
                    aiResult,

                totalCooperatives:
                    cooperativeResults.length,

                cooperatives:
                    cooperativeResults

            });


        } catch (error) {
            console.error(
                "Smart Match Error:",
                error.message
            );


            res.status(500).json({

                message:
                    "Error finding smart cooperative match",

                error:
                    error.message

            });

        }

    }

);


module.exports = router;

