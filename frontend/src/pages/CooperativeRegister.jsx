
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Building2,
    UserRound,
    Phone,
    MapPin,
    FileText,
    Camera,
    Wrench,
    Plus,
    Trash2,
    ArrowRight,
    ShieldCheck,
    CheckCircle2,
    LockKeyhole
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import api from "../services/api";

import "./CooperativeRegister.css";


function CooperativeRegister() {

    const navigate = useNavigate();


    /* =========================================
       FORM DATA
    ========================================= */

    const [form, setForm] = useState({

        societyName: "",
        registrationNumber: "",
        district: "",
        contactPerson: "",
        phone: "",
        photo: "",
        password: "",
        confirmPassword: ""

    });


    /* =========================================
       SERVICES
    ========================================= */

    const [services, setServices] = useState([

        {
            service: "",
            subServices: [""],
            price: "",
            description: ""
        }

    ]);


    /* =========================================
       STATES
    ========================================= */

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    /* =========================================
       HANDLE INPUT
    ========================================= */

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setForm((previous) => ({

            ...previous,

            [name]: value

        }));

    };


    /* =========================================
       ADD SERVICE
    ========================================= */

    const addService = () => {

        setServices((previous) => [

            ...previous,

            {
                service: "",
                subServices: [""],
                price: "",
                description: ""
            }

        ]);

    };


    /* =========================================
       REMOVE SERVICE
    ========================================= */

    const removeService = (index) => {

        if (services.length === 1) {

            return;

        }


        setServices((previous) =>

            previous.filter(
                (_, serviceIndex) =>
                    serviceIndex !== index
            )

        );

    };


    /* =========================================
       UPDATE MAIN SERVICE
    ========================================= */

    const updateService = (
        index,
        value
    ) => {

        setServices((previous) =>

            previous.map(
                (item, serviceIndex) =>

                    serviceIndex === index

                        ? {
                            ...item,
                            service: value
                        }

                        : item
            )

        );

    };


    /* =========================================
       ADD SUB SERVICE
    ========================================= */

    const addSubService = (
        serviceIndex
    ) => {

        setServices((previous) =>

            previous.map(
                (item, index) =>

                    index === serviceIndex

                        ? {
                            ...item,
                            subServices: [
                                ...item.subServices,
                                ""
                            ]
                        }

                        : item
            )

        );

    };


    /* =========================================
       UPDATE SUB SERVICE
    ========================================= */

    const updateSubService = (
        serviceIndex,
        subIndex,
        value
    ) => {

        setServices((previous) =>

            previous.map(
                (item, index) => {

                    if (index !== serviceIndex) {

                        return item;

                    }


                    return {

                        ...item,

                        subServices:
                            item.subServices.map(
                                (
                                    sub,
                                    currentSubIndex
                                ) =>

                                    currentSubIndex ===
                                    subIndex

                                        ? value

                                        : sub
                            )

                    };

                }
            )

        );

    };


    /* =========================================
       REMOVE SUB SERVICE
    ========================================= */

    const removeSubService = (
        serviceIndex,
        subIndex
    ) => {

        setServices((previous) =>

            previous.map(
                (item, index) => {

                    if (
                        index !==
                        serviceIndex
                    ) {

                        return item;

                    }


                    if (
                        item.subServices.length === 1
                    ) {

                        return item;

                    }


                    return {

                        ...item,

                        subServices:
                            item.subServices.filter(
                                (
                                    _,
                                    currentSubIndex
                                ) =>
                                    currentSubIndex !==
                                    subIndex
                            )

                    };

                }
            )

        );

    };


    /* =========================================
       UPDATE SERVICE FIELD
    ========================================= */

    const updateServiceField = (
        index,
        field,
        value
    ) => {

        setServices((previous) =>

            previous.map(
                (item, serviceIndex) =>

                    serviceIndex === index

                        ? {
                            ...item,
                            [field]: value
                        }

                        : item
            )

        );

    };


    /* =========================================
       SUBMIT
    ========================================= */

    const handleSubmit = async (e) => {

        e.preventDefault();


        setError("");

        setSuccess("");


        /* =====================================
           BASIC VALIDATION
        ===================================== */

        if (
            !form.societyName.trim() ||
            !form.registrationNumber.trim() ||
            !form.district.trim() ||
            !form.contactPerson.trim() ||
            !form.phone.trim()
        ) {

            setError(
                "Please fill all required fields."
            );

            return;

        }


        if (!form.password) {

            setError(
                "Please create a password."
            );

            return;

        }


        if (form.password.length < 6) {

            setError(
                "Password must be at least 6 characters."
            );

            return;

        }


        if (
            form.password !==
            form.confirmPassword
        ) {

            setError(
                "Passwords do not match."
            );

            return;

        }


        try {

            setLoading(true);


            /* =================================
               CLEAN SERVICES
            ================================= */

            const cleanedServices =
                services

                    .filter(
                        (item) =>
                            item.service.trim() !== ""
                    )

                    .map((item) => ({

                        service:
                            item.service.trim(),

                        subServices:
                            item.subServices

                                .filter(
                                    (sub) =>
                                        sub.trim() !== ""
                                )

                                .map(
                                    (sub) =>
                                        sub.trim()
                                ),

                        price:
                            Number(item.price) || 0,

                        description:
                            item.description.trim()

                    }));


            /* =================================
               REQUEST DATA
            ================================= */

            const requestData = {

                societyName:
                    form.societyName.trim(),

                registrationNumber:
                    form.registrationNumber.trim(),

                district:
                    form.district.trim(),

                contactPerson:
                    form.contactPerson.trim(),

                phone:
                    form.phone.trim(),

                photo:
                    form.photo.trim(),

                password:
                    form.password,

                services:
                    cleanedServices

            };


            console.log(
                "Sending Cooperative Registration:",
                requestData
            );


            /* =================================
               API REQUEST
            ================================= */

            const response =
                await api.post(
                    "/cooperatives",
                    requestData
                );


            console.log(
                "Cooperative Registration Response:",
                response.data
            );


            /* =================================
               SUCCESS
            ================================= */

            setSuccess(

                response.data?.message ||

                "Society registered successfully."

            );


            /* =================================
               REDIRECT
            ================================= */

            setTimeout(() => {

                navigate(
                    "/cooperative-login"
                );

            }, 1500);


        }

        catch (err) {

            console.error(
                "Cooperative Registration Error:",
                err
            );


            /* =================================
               ACTUAL SERVER ERROR
            ================================= */

            const serverMessage =
                err.response?.data?.message;


            const serverError =
                err.response?.data?.error;


            if (serverMessage) {

                setError(

                    serverError

                        ? `${serverMessage} - ${serverError}`

                        : serverMessage

                );

            }

            else if (
                err.code ===
                "ERR_NETWORK"
            ) {

                setError(
                    "Backend server is not running. Please start the backend on port 5000."
                );

            }

            else {

                setError(
                    "Unable to register society. Please check the backend server."
                );

            }

        }

        finally {

            setLoading(false);

        }

    };


    /* =========================================
       UI
    ========================================= */

    return (

        <div className="coop-register-page">


            {/* =================================
                LEFT VISUAL
            ================================= */}

            <div className="coop-register-visual">

                <div className="coop-register-overlay"></div>


                {/* BRAND */}

                <div className="coop-register-brand">

                    <img
                        src={logo}
                        alt="SkillDnest"
                    />


                    <div>

                        <h2>
                            SkillDnest
                        </h2>

                        <span>
                            Local Skills, Trusted Services
                        </span>

                    </div>

                </div>



                {/* CONTENT */}

                <div className="coop-register-visual-content">


                    <div className="coop-register-badge">

                        <ShieldCheck size={17} />

                        Trusted Cooperative Network

                    </div>


                    <h1>

                        Register your

                        <br />

                        <span>
                            cooperative society.
                        </span>

                    </h1>


                    <p>

                        Bring your local workers,
                        services and community
                        together on SkillDnest.

                    </p>


                    <div className="coop-register-points">


                        <div>

                            <CheckCircle2 size={17} />

                            Showcase your services

                        </div>


                        <div>

                            <CheckCircle2 size={17} />

                            Connect with customers

                        </div>


                        <div>

                            <CheckCircle2 size={17} />

                            Manage local workers

                        </div>


                    </div>

                </div>

            </div>



            {/* =================================
                RIGHT FORM AREA
            ================================= */}

            <div className="coop-register-area">


                <div className="coop-register-card">


                    {/* HEADING */}

                    <div className="coop-register-heading">


                        <div className="coop-register-icon">

                            <Building2 size={23} />

                        </div>


                        <div>

                            <small>
                                JOIN SKILLDNEST
                            </small>

                            <h1>
                                Society Registration
                            </h1>

                        </div>

                    </div>


                    <p className="coop-register-description">

                        Create your cooperative profile
                        and start connecting with customers.

                    </p>



                    {/* ERROR */}

                    {error && (

                        <div className="coop-register-error">

                            {error}

                        </div>

                    )}



                    {/* SUCCESS */}

                    {success && (

                        <div className="coop-register-success">

                            <CheckCircle2 size={17} />

                            {success}

                        </div>

                    )}



                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                    >


                        {/* =================================
                            BASIC INFORMATION
                        ================================= */}

                        <div className="coop-form-grid">


                            {/* SOCIETY NAME */}

                            <div className="coop-input-group">

                                <label>
                                    Society Name
                                </label>

                                <div className="coop-input-wrapper">

                                    <Building2 size={17} />

                                    <input
                                        type="text"
                                        name="societyName"
                                        value={
                                            form.societyName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter society name"
                                        required
                                    />

                                </div>

                            </div>



                            {/* REGISTRATION NUMBER */}

                            <div className="coop-input-group">

                                <label>
                                    Registration Number
                                </label>

                                <div className="coop-input-wrapper">

                                    <FileText size={17} />

                                    <input
                                        type="text"
                                        name="registrationNumber"
                                        value={
                                            form.registrationNumber
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Registration number"
                                        required
                                    />

                                </div>

                            </div>



                            {/* DISTRICT */}

                            <div className="coop-input-group">

                                <label>
                                    District
                                </label>

                                <div className="coop-input-wrapper">

                                    <MapPin size={17} />

                                    <input
                                        type="text"
                                        name="district"
                                        value={
                                            form.district
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter district"
                                        required
                                    />

                                </div>

                            </div>



                            {/* CONTACT PERSON */}

                            <div className="coop-input-group">

                                <label>
                                    Contact Person
                                </label>

                                <div className="coop-input-wrapper">

                                    <UserRound size={17} />

                                    <input
                                        type="text"
                                        name="contactPerson"
                                        value={
                                            form.contactPerson
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Contact person name"
                                        required
                                    />

                                </div>

                            </div>



                            {/* PHONE */}

                            <div className="coop-input-group">

                                <label>
                                    Phone Number
                                </label>

                                <div className="coop-input-wrapper">

                                    <Phone size={17} />

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={
                                            form.phone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Registered phone number"
                                        required
                                    />

                                </div>

                            </div>



                            {/* PHOTO */}

                            <div className="coop-input-group">

                                <label>
                                    Society Photo URL
                                </label>

                                <div className="coop-input-wrapper">

                                    <Camera size={17} />

                                    <input
                                        type="url"
                                        name="photo"
                                        value={
                                            form.photo
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="https://..."
                                    />

                                </div>

                            </div>



                            {/* PASSWORD */}

                            <div className="coop-input-group">

                                <label>
                                    Password
                                </label>

                                <div className="coop-input-wrapper">

                                    <LockKeyhole size={17} />

                                    <input
                                        type="password"
                                        name="password"
                                        value={
                                            form.password
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Create password"
                                        minLength="6"
                                        required
                                    />

                                </div>

                            </div>



                            {/* CONFIRM PASSWORD */}

                            <div className="coop-input-group">

                                <label>
                                    Confirm Password
                                </label>

                                <div className="coop-input-wrapper">

                                    <LockKeyhole size={17} />

                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={
                                            form.confirmPassword
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Confirm password"
                                        minLength="6"
                                        required
                                    />

                                </div>

                            </div>

                        </div>



                        {/* =================================
                            SERVICES
                        ================================= */}

                        <div className="coop-services-section">


                            <div className="coop-services-header">


                                <div>

                                    <h3>
                                        Services
                                    </h3>

                                    <p>
                                        Add services offered by your society
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="add-service-btn"
                                    onClick={addService}
                                >

                                    <Plus size={16} />

                                    Add Service

                                </button>

                            </div>



                            {/* SERVICE CARDS */}

                            {services.map(
                                (
                                    item,
                                    index
                                ) => (

                                    <div
                                        className="service-card"
                                        key={index}
                                    >


                                        {/* HEADER */}

                                        <div className="service-card-header">


                                            <strong>
                                                Service {index + 1}
                                            </strong>


                                            {services.length > 1 && (

                                                <button
                                                    type="button"
                                                    className="remove-service-btn"
                                                    onClick={() =>
                                                        removeService(
                                                            index
                                                        )
                                                    }
                                                >

                                                    <Trash2 size={16} />

                                                </button>

                                            )}

                                        </div>



                                        {/* MAIN SERVICE */}

                                        <div className="coop-input-group">

                                            <label>
                                                Main Service
                                            </label>


                                            <div className="coop-input-wrapper">

                                                <Wrench size={17} />

                                                <input
                                                    type="text"
                                                    value={
                                                        item.service
                                                    }
                                                    onChange={(e) =>
                                                        updateService(
                                                            index,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. Plumbing"
                                                />

                                            </div>

                                        </div>



                                        {/* SUB SERVICES */}

                                        <div className="subservices-box">


                                            <label>
                                                Sub-services
                                            </label>


                                            {item.subServices.map(
                                                (
                                                    sub,
                                                    subIndex
                                                ) => (

                                                    <div
                                                        className="subservice-row"
                                                        key={
                                                            subIndex
                                                        }
                                                    >


                                                        <input
                                                            type="text"
                                                            value={sub}
                                                            onChange={(e) =>
                                                                updateSubService(
                                                                    index,
                                                                    subIndex,
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="e.g. Pipe repair"
                                                        />


                                                        {item.subServices.length > 1 && (

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeSubService(
                                                                        index,
                                                                        subIndex
                                                                    )
                                                                }
                                                            >

                                                                <Trash2 size={15} />

                                                            </button>

                                                        )}

                                                    </div>

                                                )
                                            )}



                                            <button
                                                type="button"
                                                className="add-subservice-btn"
                                                onClick={() =>
                                                    addSubService(
                                                        index
                                                    )
                                                }
                                            >

                                                <Plus size={15} />

                                                Add Sub-service

                                            </button>

                                        </div>



                                        {/* PRICE + DESCRIPTION */}

                                        <div className="coop-form-grid">


                                            <div className="coop-input-group">

                                                <label>
                                                    Price
                                                </label>

                                                <div className="coop-input-wrapper">

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={
                                                            item.price
                                                        }
                                                        onChange={(e) =>
                                                            updateServiceField(
                                                                index,
                                                                "price",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter price"
                                                    />

                                                </div>

                                            </div>



                                            <div className="coop-input-group">

                                                <label>
                                                    Description
                                                </label>

                                                <div className="coop-input-wrapper">

                                                    <input
                                                        type="text"
                                                        value={
                                                            item.description
                                                        }
                                                        onChange={(e) =>
                                                            updateServiceField(
                                                                index,
                                                                "description",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Service description"
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>



                        {/* =================================
                            SUBMIT
                        ================================= */}

                        <button
                            type="submit"
                            className="coop-submit-btn"
                            disabled={loading}
                        >

                            {loading
                                ? "Creating Society..."
                                : "Create Cooperative"
                            }


                            {!loading && (

                                <ArrowRight size={19} />

                            )}

                        </button>



                        {/* SECURITY */}

                        <div className="coop-form-footer">

                            <ShieldCheck size={16} />

                            Your cooperative information
                            is securely processed.

                        </div>


                    </form>

                </div>

            </div>

        </div>

    );

}


export default CooperativeRegister;

