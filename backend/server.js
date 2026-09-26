const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
// IMPORTANT:
// dotenv ko routes import karne se pehle load karna hai
dotenv.config();

const connectDB = require("./config/db");

// Routes
const workerRoutes = require("./routes/workerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const cooperativeRoutes = require("./routes/cooperativeRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const smartMatchRoutes = require("./routes/smartMatchRoutes");

// Connect MongoDB
connectDB();

const app = express();

// Middleware
// Middleware
app.use(cors());
app.use(express.json());
// Home route
app.get("/", (req, res) => {
    res.send("Cooperative Gig Platform Backend Running");
});

// API Routes
app.use("/api/workers", workerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cooperatives", cooperativeRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

// AI + Worker Smart Matching
app.use("/api", smartMatchRoutes);

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});