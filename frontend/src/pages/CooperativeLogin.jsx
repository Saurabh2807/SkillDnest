import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    ArrowRight,
    ShieldCheck,
    Home,
    LockKeyhole
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import api from "../services/api";

import "./CooperativeLogin.css";

function CooperativeLogin() {

    const navigate = useNavigate();

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response = await api.post(
                "/auth/login",
                {
                    phone,
                    password
                }
            );

            const { token, user } = response.data;

            if (user.role !== "CooperativeAdmin") {
                setError(
                    "This account is not a cooperative account."
                );
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );

            navigate("/cooperative-dashboard");

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Invalid phone or password."
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="coop-login-page">

            {/* LEFT SIDE */}

            <div className="coop-login-visual">

                <div className="coop-login-overlay"></div>

                <button
                    className="coop-login-home"
                    onClick={() => navigate("/")}
                >
                    <Home size={17} />
                    Home
                </button>

                <div className="coop-login-visual-content">

                    <div className="coop-login-badge">
                        <ShieldCheck size={17} />
                        Trusted Cooperative Network
                    </div>

                    <h1>
                        Empower your
                        <br />
                        <span>local community.</span>
                    </h1>

                    <p>
                        Manage your cooperative, workers,
                        services and customer bookings
                        through SkillDnest.
                    </p>

                    <div className="coop-login-points">

                        <div>
                            <span>✓</span>
                            Manage your workers
                        </div>

                        <div>
                            <span>✓</span>
                            Showcase your services
                        </div>

                        <div>
                            <span>✓</span>
                            Connect with customers
                        </div>

                    </div>

                </div>

            </div>


            {/* RIGHT SIDE */}

            <div className="coop-login-area">

                <div className="coop-login-card">

                    <div className="coop-login-brand">

                        <img
                            src={logo}
                            alt="SkillDnest"
                        />

                        <div>
                            <h2>SkillDnest</h2>
                            <span>
                                Local Skills, Trusted Services
                            </span>
                        </div>

                    </div>


                    <div className="coop-login-heading">

                        <div className="coop-login-icon">
                            <Building2 size={23} />
                        </div>

                        <div>
                            <small>
                                WELCOME BACK
                            </small>

                            <h1>
                                Society Login
                            </h1>
                        </div>

                    </div>

                    <p className="coop-login-description">
                        Login to manage your cooperative
                        and local service network.
                    </p>


                    {error && (
                        <div className="coop-login-error">
                            {error}
                        </div>
                    )}


                    <form onSubmit={handleLogin}>

                        <div className="coop-login-input">

                            <label>
                                Phone Number
                            </label>

                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) =>
                                    setPhone(e.target.value)
                                }
                                placeholder="Enter registered phone"
                                required
                            />

                        </div>


                        <div className="coop-login-input">

                            <label>
                                Password
                            </label>

                            <div className="password-wrapper">

                                <LockKeyhole size={17} />

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Enter your password"
                                    required
                                />

                            </div>

                        </div>


                        <button
                            type="submit"
                            className="coop-login-btn"
                            disabled={loading}
                        >

                            {loading
                                ? "Logging in..."
                                : "Login as Society"
                            }

                            {!loading && (
                                <ArrowRight size={18} />
                            )}

                        </button>

                    </form>


                    <div className="coop-login-divider">
                        <span>OR</span>
                    </div>


                    <div className="coop-register-box">

                        <div>
                            <strong>
                                New society?
                            </strong>

                            <p>
                                Register your cooperative
                            </p>
                        </div>

                        <button
                            onClick={() =>
                                navigate("/cooperative-register")
                            }
                        >
                            Register Society
                        </button>

                    </div>


                    <div className="coop-login-security">

                        <ShieldCheck size={16} />

                        Secure cooperative authentication

                    </div>

                </div>

            </div>

        </div>
    );
}

export default CooperativeLogin;