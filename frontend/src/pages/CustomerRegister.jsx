import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    ShieldCheck,
    UserRound,
    Home,
    CheckCircle2
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import api from "../services/api";
import "./CustomerRegister.css";

function CustomerRegister() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");

        // Password match check
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/auth/register", {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                password: formData.password,
                role: "Customer"
            });

            console.log("Registration successful:", response.data);

            // Registration successful
            navigate("/customer-dashboard");

        } catch (err) {
            console.error("Registration Error:", err);

            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="customer-register-page">

            {/* LEFT VISUAL */}
            <div className="register-visual">

                <div className="register-bg-image"></div>
                <div className="register-overlay"></div>

                <button
                    className="register-home-btn"
                    onClick={() => navigate("/")}
                >
                    <Home size={17} />
                    Home
                </button>

                <div className="register-visual-content">

                    <div className="register-badge">
                        <ShieldCheck size={17} />
                        Trusted Local Network
                    </div>

                    <h1>
                        Your local
                        <br />
                        <span>service journey starts here.</span>
                    </h1>

                    <p>
                        Create your SkillDnest account and discover
                        trusted workers, cooperative societies and
                        transparent service prices.
                    </p>

                    <div className="register-benefits">

                        <div>
                            <CheckCircle2 size={19} />
                            Verified local workers
                        </div>

                        <div>
                            <CheckCircle2 size={19} />
                            Compare cooperative prices
                        </div>

                        <div>
                            <CheckCircle2 size={19} />
                            Simple & secure booking
                        </div>

                    </div>

                </div>
            </div>


            {/* RIGHT REGISTER */}
            <div className="register-area">

                <div className="register-card">

                    {/* BRAND */}
                    <div className="register-brand">

                        <img
                            src={logo}
                            alt="SkillDnest Logo"
                        />

                        <div>
                            <h2>SkillDnest</h2>
                            <p>Local Skills, Trusted Services</p>
                        </div>

                    </div>


                    {/* HEADING */}
                    <div className="register-heading">

                        <div className="register-icon">
                            <UserRound size={23} />
                        </div>

                        <div>
                            <span>GET STARTED</span>
                            <h2>Create Account</h2>
                        </div>

                    </div>

                    <p className="register-description">
                        Join SkillDnest and find trusted services near you.
                    </p>


                    {/* ERROR */}
                    {error && (
                        <div className="register-error">
                            {error}
                        </div>
                    )}


                    {/* FORM */}
                    <form onSubmit={handleRegister}>

                        {/* NAME + PHONE */}
                        <div className="form-row">

                            <div className="form-group">

                                <label>Full Name</label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>Phone</label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                    required
                                />

                            </div>

                        </div>


                        {/* EMAIL */}
                        <div className="form-group">

                            <label>Email / Gmail</label>

                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />

                        </div>


                        {/* PASSWORD */}
                        <div className="form-row">

                            <div className="form-group">

                                <label>Password</label>

                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create password"
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>Confirm Password</label>

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm password"
                                    required
                                />

                            </div>

                        </div>


                        {/* LOCATION - UI ONLY FOR NOW */}
                        <div className="form-row">

                            <div className="form-group">

                                <label>City / District</label>

                                <input
                                    type="text"
                                    placeholder="Your city or district"
                                />

                            </div>


                            <div className="form-group">

                                <label>Address</label>

                                <input
                                    type="text"
                                    placeholder="Your area / locality"
                                />

                            </div>

                        </div>


                        {/* SERVICES */}
                        <div className="service-preference">

                            <label>
                                What services are you interested in?
                            </label>

                            <div className="service-options">

                                <span>⚡ Electrical</span>
                                <span>🔧 Plumbing</span>
                                <span>🪚 Carpenter</span>
                                <span>🧹 Cleaning</span>
                                <span>🌾 Agriculture</span>

                            </div>

                        </div>


                        {/* BUTTON */}
                        <button
                            type="submit"
                            className="create-account-btn"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Account..."
                                : "Create Customer Account"
                            }

                            {!loading && <ArrowRight size={19} />}
                        </button>

                    </form>


                    {/* LOGIN */}
                    <div className="already-account">

                        <span>
                            Already have an account?
                        </span>

                        <button
                            onClick={() => navigate("/customer-login")}
                        >
                            Login
                        </button>

                    </div>


                    {/* SECURITY */}
                    <div className="register-security">

                        <ShieldCheck size={17} />

                        Your information is securely protected.

                    </div>

                </div>

            </div>

        </div>
    );
}

export default CustomerRegister;