import { useNavigate } from "react-router-dom";
import logo from "../assets/Skill D Nest.jpeg";
import "./Welcome.css";

function Welcome() {
    const navigate = useNavigate();

    return (
        <div className="welcome-page">

            {/* Background Image */}
            <div className="welcome-background"></div>

            {/* Dark Overlay */}
            <div className="welcome-overlay"></div>

            {/* Main Content */}
            <div className="welcome-content">

                <div className="welcome-logo">
                    <img src={logo} alt="SkillDnest Logo" />
                </div>

                <div className="welcome-text">
                    <p className="welcome-small">LOCAL COOPERATIVE SERVICES</p>

                    <h1>
                        Local Skills.
                        <br />
                        <span>Trusted Services.</span>
                    </h1>

                    <p className="welcome-description">
                        Connect with trusted local workers and cooperative societies
                        for reliable household, community and agriculture services.
                    </p>
                </div>

                {/* Decorative Service Cards */}
                <div className="service-floating-cards">
                    <div className="floating-card card-one">
                        ⚡ Electrical
                    </div>

                    <div className="floating-card card-two">
                        🌾 Agriculture
                    </div>

                    <div className="floating-card card-three">
                        🔧 Repair
                    </div>
                </div>

                <button
                    className="welcome-login-btn"
                    onClick={() => navigate("/login")}
                >
                    LOGIN
                    <span>→</span>
                </button>

            </div>
        </div>
    );
}

export default Welcome;