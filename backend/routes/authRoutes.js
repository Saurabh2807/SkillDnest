const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

// =========================
// REGISTER
// =========================
router.post("/register", async (req, res) => {
    try {
        const { name, phone, email, password, role } = req.body;

        // Required fields check
        if (!name || !phone || !email || !password) {
            return res.status(400).json({
                message: "Name, phone, email and password are required"
            });
        }

        // Check existing phone
        const existingPhone = await User.findOne({ phone });

        if (existingPhone) {
            return res.status(400).json({
                message: "Phone number already registered"
            });
        }

        // Check existing email
        const existingEmail = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingEmail) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            phone,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || "Customer"
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Register Error:", error);

        res.status(500).json({
            message: "Server error during registration"
        });
    }
});


// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Required fields check
        if (!phone || !password) {
            return res.status(400).json({
                message: "Phone and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(401).json({
                message: "Invalid phone or password"
            });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid phone or password"
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        res.status(500).json({
            message: "Server error during login"
        });
    }
});

module.exports = router;