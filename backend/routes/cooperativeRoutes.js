
const express = require("express");
const bcrypt = require("bcryptjs");

const Cooperative = require("../models/Cooperative");
const Worker = require("../models/Worker");
const User = require("../models/User");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// REGISTER COOPERATIVE SOCIETY
// ==========================================

router.post("/", async (req, res) => {

    try {

        const {
            societyName,
            registrationNumber,
            district,
            contactPerson,
            phone,
            photo,
            password,
            services
        } = req.body;


        // Required fields

        if (
            !societyName ||
            !registrationNumber ||
            !district ||
            !contactPerson ||
            !phone ||
            !password
        ) {

            return res.status(400).json({
                message:
                    "Society name, registration number, district, contact person, phone and password are required"
            });

        }


        // Check cooperative registration number

        const existingCooperative =
            await Cooperative.findOne({
                registrationNumber
            });


        if (existingCooperative) {

            return res.status(400).json({
                message:
                    "Cooperative with this registration number already exists"
            });

        }


        // Check phone in User collection

        const existingUser =
            await User.findOne({
                phone
            });


        if (existingUser) {

            return res.status(400).json({
                message:
                    "Phone number already registered"
            });

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create User account

        const user = await User.create({

            name: contactPerson,

            phone,

            password: hashedPassword,

            role: "CooperativeAdmin"

        });


        // Create Cooperative

        const cooperative =
            await Cooperative.create({

                societyName,

                registrationNumber,

                district,

                contactPerson,

                phone,

                photo: photo || "",

                services: services || [],

                verificationStatus: "Pending"

            });


        res.status(201).json({

            message:
                "Cooperative registered successfully",

            cooperative: {

                id: cooperative._id,

                societyName:
                    cooperative.societyName,

                registrationNumber:
                    cooperative.registrationNumber,

                district:
                    cooperative.district,

                verificationStatus:
                    cooperative.verificationStatus

            },

            user: {

                id: user._id,

                name: user.name,

                phone: user.phone,

                role: user.role

            }

        });


    } catch (error) {

        console.error(
            "Cooperative Registration Error:",
            error
        );


        res.status(500).json({

            message:
                "Error registering cooperative",

            error:
                error.message

        });

    }

});


// ==========================================
// GET ALL COOPERATIVES
// ==========================================

router.get("/", async (req, res) => {

    try {

        const cooperatives =
            await Cooperative.find();

        res.status(200).json(
            cooperatives
        );

    } catch (error) {

        res.status(500).json({

            message:
                "Error fetching cooperatives",

            error:
                error.message

        });

    }

});


// ==========================================
// VERIFY COOPERATIVE
// ADMIN ONLY
// ==========================================

router.patch(
    "/:id/verify",
    protect,
    allowRoles("CooperativeAdmin"),
    async (req, res) => {

        try {

            const cooperative =
                await Cooperative.findByIdAndUpdate(

                    req.params.id,

                    {
                        verificationStatus:
                            "Verified"
                    },

                    {
                        new: true
                    }

                );


            if (!cooperative) {

                return res.status(404).json({

                    message:
                        "Cooperative not found"

                });

            }


            res.status(200).json({

                message:
                    "Cooperative verified successfully",

                cooperative

            });

        } catch (error) {

            res.status(500).json({

                message:
                    "Error verifying cooperative",

                error:
                    error.message

            });

        }

    }
);


// ==========================================
// GET COOPERATIVE WORKERS
// ==========================================

router.get(
    "/:id/workers",
    async (req, res) => {

        try {

            const workers =
                await Worker.find({

                    cooperativeId:
                        req.params.id

                });


            res.status(200).json({

                cooperativeId:
                    req.params.id,

                totalWorkers:
                    workers.length,

                workers

            });

        } catch (error) {

            res.status(500).json({

                message:
                    "Error fetching cooperative workers",

                error:
                    error.message

            });

        }

    }
);


// ==========================================
// GET COOPERATIVE BY ID
// ==========================================

router.get(
    "/:id",
    async (req, res) => {

        try {

            const cooperative =
                await Cooperative.findById(
                    req.params.id
                );


            if (!cooperative) {

                return res.status(404).json({

                    message:
                        "Cooperative not found"

                });

            }


            res.status(200).json(
                cooperative
            );

        } catch (error) {

            res.status(500).json({

                message:
                    "Error fetching cooperative",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;

