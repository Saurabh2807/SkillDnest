
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Users,
    User,
    Phone,
    MapPin,
    Briefcase,
    Clock,
    Image,
    ArrowLeft,
    Save,
    ShieldCheck,
    Wrench
} from "lucide-react";

import api from "../services/api";
import "./AddWorker.css";

function AddWorker() {

    const navigate = useNavigate();
    const location = useLocation();

    const cooperativeId =
        location.state?.cooperativeId || "";

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        photo: "",
        skills: "",
        subServices: "",
        experience: "",
        location: "",
        latitude: "",
        longitude: "",
        availability: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    const handleChange = (e) => {

        const { name, value, checked, type } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!cooperativeId) {
            setError(
                "Cooperative information is missing. Please open this page from the dashboard."
            );
            return;
        }


        try {

            setLoading(true);


            const workerData = {
                cooperativeId: cooperativeId,

                name: formData.name.trim(),

                phone: formData.phone.trim(),

                photo: formData.photo.trim(),

                skills: formData.skills
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter((skill) => skill !== ""),

                subServices: formData.subServices
                    .split(",")
                    .map((service) => service.trim())
                    .filter((service) => service !== ""),

                experience:
                    Number(formData.experience) || 0,

                location:
                    formData.location.trim(),

                latitude:
                    formData.latitude === ""
                        ? null
                        : Number(formData.latitude),

                longitude:
                    formData.longitude === ""
                        ? null
                        : Number(formData.longitude),

                availability:
                    formData.availability
            };


            await api.post(
                "/workers",
                workerData,
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );


            setSuccess(
                "Worker added successfully!"
            );


            setTimeout(() => {
                navigate("/cooperative-dashboard");
            }, 1000);


        } catch (err) {

            console.error(
                "Add Worker Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to add worker. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };


    return (
        <div className="add-worker-page">


            {/* HEADER */}

            <header className="add-worker-header">

                <button
                    type="button"
                    className="back-btn"
                    onClick={() =>
                        navigate(
                            "/cooperative-dashboard"
                        )
                    }
                >
                    <ArrowLeft size={18} />

                    Back to Dashboard
                </button>


                <div className="header-security">

                    <ShieldCheck size={17} />

                    Secure Worker Management

                </div>

            </header>



            {/* MAIN */}

            <main className="add-worker-main">

                <div className="add-worker-container">


                    {/* INTRO */}

                    <div className="add-worker-intro">

                        <div className="intro-icon">
                            <Users size={25} />
                        </div>


                        <div>

                            <span>
                                WORKFORCE MANAGEMENT
                            </span>

                            <h1>
                                Add New Worker
                            </h1>

                            <p>
                                Register a skilled worker
                                under your cooperative society.
                            </p>

                        </div>

                    </div>



                    {/* CARD */}

                    <div className="add-worker-card">


                        {/* ERROR */}

                        {error && (
                            <div className="add-worker-error">
                                {error}
                            </div>
                        )}


                        {/* SUCCESS */}

                        {success && (
                            <div className="add-worker-success">

                                <ShieldCheck size={17} />

                                {success}

                            </div>
                        )}



                        <form
                            onSubmit={handleSubmit}
                        >


                            {/* BASIC INFORMATION */}

                            <section className="form-section">

                                <div className="form-section-heading">

                                    <div>

                                        <h2>
                                            Basic Information
                                        </h2>

                                        <p>
                                            Worker identity and contact details
                                        </p>

                                    </div>

                                </div>



                                <div className="worker-form-grid">


                                    {/* NAME */}

                                    <div className="worker-input-group">

                                        <label>
                                            Worker Name *
                                        </label>

                                        <div className="worker-input-wrapper">

                                            <User size={17} />

                                            <input
                                                type="text"
                                                name="name"
                                                value={
                                                    formData.name
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter worker name"
                                                required
                                            />

                                        </div>

                                    </div>



                                    {/* PHONE */}

                                    <div className="worker-input-group">

                                        <label>
                                            Phone Number *
                                        </label>

                                        <div className="worker-input-wrapper">

                                            <Phone size={17} />

                                            <input
                                                type="tel"
                                                name="phone"
                                                value={
                                                    formData.phone
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter phone number"
                                                required
                                            />

                                        </div>

                                    </div>



                                    {/* PHOTO */}

                                    <div className="worker-input-group full-width">

                                        <label>
                                            Photo URL
                                        </label>

                                        <div className="worker-input-wrapper">

                                            <Image size={17} />

                                            <input
                                                type="url"
                                                name="photo"
                                                value={
                                                    formData.photo
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="https://example.com/photo.jpg"
                                            />

                                        </div>

                                        <small>
                                            Optional — image URL only.
                                        </small>

                                    </div>

                                </div>

                            </section>



                            {/* SKILLS */}

                            <section className="form-section">

                                <div className="form-section-heading">

                                    <div>

                                        <h2>
                                            Skills & Services
                                        </h2>

                                        <p>
                                            Add worker skills and sub-services
                                        </p>

                                    </div>

                                    <Wrench size={20} />

                                </div>



                                <div className="worker-form-grid">


                                    {/* SKILLS */}

                                    <div className="worker-input-group">

                                        <label>
                                            Skills *
                                        </label>

                                        <div className="worker-input-wrapper">

                                            <Briefcase size={17} />

                                            <input
                                                type="text"
                                                name="skills"
                                                value={
                                                    formData.skills
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Plumber, Electrician"
                                                required
                                            />

                                        </div>

                                        <small>
                                            Separate multiple skills with commas.
                                        </small>

                                    </div>



                                    {/* SUB SERVICES */}

                                    <div className="worker-input-group">

                                        <label>
                                            Sub-services
                                        </label>

                                        <div className="worker-input-wrapper">

                                            <Wrench size={17} />

                                            <input
                                                type="text"
                                                name="subServices"
                                                value={
                                                    formData.subServices
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Pipe repair, Tap repair"
                                            />

                                        </div>

                                        <small>
                                            Separate multiple services with commas.
                                        </small>

                                    </div>

                                </div>

                            </section>



                            {/* EXPERIENCE & LOCATION */}

                            <section className="form-section">

                                <div className="form-section-heading">

                                    <div>

                                        <h2>
                                            Experience & Location
                                        </h2>

                                        <p>
                                            Help customers find the right worker
                                        </p>

                                    </div>

                                    <MapPin size={20} />

                                </div>



                                <div className="worker-form-grid">


                                    {/* EXPERIENCE */}

                                    <div className="worker-input-group">

                                        <label>
                                            Experience (Years)
                                        </label>

                                        <div className="worker-input-wrapper">

                                            <Clock size={17} />

                                            <input
                                                type="number"
                                                name="experience"
                                                min="0"
                                                max="60"
                                                value={
                                                    formData.experience
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="e.g. 5"
                                            />

                                        </div>

                                    </div>



                                    {/* LOCATION */}

                                    <div className="worker-input-group">

                                        <label>
                                            Location *
                                        </label>

                                        <div className="worker-input-wrapper">

                                            <MapPin size={17} />

                                            <input
                                                type="text"
                                                name="location"
                                                value={
                                                    formData.location
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Satna, Madhya Pradesh"
                                                required
                                            />

                                        </div>

                                    </div>



                                    {/* LATITUDE */}

                                    <div className="worker-input-group">

                                        <label>
                                            Latitude
                                        </label>

                                        <div className="worker-input-wrapper">

                                            <MapPin size={17} />

                                            <input
                                                type="number"
                                                step="any"
                                                name="latitude"
                                                value={
                                                    formData.latitude
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="24.6005"
                                            />

                                        </div>

                                    </div>



                                    {/* LONGITUDE */}

                                    <div className="worker-input-group">

                                        <label>
                                            Longitude
                                        </label>

                                        <div className="worker-input-wrapper">

                                            <MapPin size={17} />

                                            <input
                                                type="number"
                                                step="any"
                                                name="longitude"
                                                value={
                                                    formData.longitude
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="80.8322"
                                            />

                                        </div>

                                    </div>

                                </div>

                            </section>



                            {/* AVAILABILITY */}

                            <div className="availability-box">

                                <div>

                                    <strong>
                                        Worker Availability
                                    </strong>

                                    <p>
                                        Allow this worker to receive
                                        new service requests.
                                    </p>

                                </div>


                                <label className="switch">

                                    <input
                                        type="checkbox"
                                        name="availability"
                                        checked={
                                            formData.availability
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <span className="slider"></span>

                                </label>

                            </div>



                            {/* SUBMIT */}

                            <button
                                type="submit"
                                className="save-worker-btn"
                                disabled={loading}
                            >

                                {loading ? (

                                    <>
                                        Saving Worker...
                                    </>

                                ) : (

                                    <>
                                        <Save size={18} />
                                        Add Worker
                                    </>

                                )}

                            </button>

                        </form>

                    </div>



                    {/* NOTE */}

                    <div className="worker-form-note">

                        <ShieldCheck size={16} />

                        Only verified cooperative workers
                        can be matched with customers.

                    </div>

                </div>

            </main>

        </div>
    );
}

export default AddWorker;

