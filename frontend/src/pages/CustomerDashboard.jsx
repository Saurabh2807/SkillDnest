import { useEffect, useMemo, useState } from "react";
import {
    Search,
    MapPin,
    Sparkles,
    ShieldCheck,
    Clock3,
    ArrowRight,
    Wrench,
    Zap,
    Droplets,
    Tractor,
    Star,
    Users,
    Building2,
    CheckCircle2,
    CircleDollarSign,
    UserRound,
    ChevronRight,
    BadgeCheck,
    Bot
} from "lucide-react";

import api from "../services/api";
import "./CustomerDashboard.css";


const normalizeArray = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value === undefined || value === null || value === "") return [];
    return [value];
};


const getWorkerSkills = (worker = {}) => {
    return [
        ...normalizeArray(worker.skills),
        ...normalizeArray(worker.skill),
        ...normalizeArray(worker.service),
        ...normalizeArray(worker.category),
        ...normalizeArray(worker.subServices)
    ]
        .map((item) => String(item).trim())
        .filter(Boolean);
};


const normalizeStatus = (status) => {
    if (!status) return "Pending";

    const value = String(status).toLowerCase();

    if (
        value.includes("verif") ||
        value.includes("approv") ||
        value === "approved"
    ) {
        return "Verified";
    }

    if (value.includes("reject")) {
        return "Rejected";
    }

    return "Pending";
};


const isAvailable = (worker = {}) => {
    if (typeof worker.availability === "boolean") {
        return worker.availability;
    }

    if (typeof worker.available === "boolean") {
        return worker.available;
    }

    const status = String(
        worker.availability || worker.status || ""
    ).toLowerCase();

    if (
        status.includes("available") ||
        status.includes("online") ||
        status === "active"
    ) {
        return true;
    }

    return false;
};


const getSocietyName = (society = {}) => {
    return (
        society.name ||
        society.societyName ||
        society.cooperativeName ||
        society.title ||
        "Cooperative Society"
    );
};


const getSocietyLocation = (society = {}) => {
    return (
        society.location ||
        society.address ||
        society.city ||
        "Local community"
    );
};


const getPriceInfo = (worker = {}, aiResult = null) => {
    const fairPrice = worker.fairPrice || worker.fair_price;

    const min =
        fairPrice?.min ??
        fairPrice?.minimum ??
        worker.minPrice ??
        worker.minimumPrice ??
        worker.priceMin ??
        worker.min_price;

    const max =
        fairPrice?.max ??
        fairPrice?.maximum ??
        worker.maxPrice ??
        worker.maximumPrice ??
        worker.priceMax ??
        worker.max_price;

    if (min !== undefined && max !== undefined) {
        return {
            text: `₹${min} – ₹${max}`,
            source: "Cooperative price"
        };
    }

    if (worker.priceRange) {
        return {
            text: String(worker.priceRange),
            source: "Cooperative price"
        };
    }

    if (worker.price !== undefined && worker.price !== null) {
        return {
            text: `₹${worker.price}`,
            source: "Cooperative price"
        };
    }

    if (worker.hourlyRate !== undefined && worker.hourlyRate !== null) {
        return {
            text: `₹${worker.hourlyRate}/hr`,
            source: "Cooperative rate"
        };
    }

    const aiFairPrice =
        aiResult?.fairPrice ||
        aiResult?.estimatedPrice ||
        aiResult?.priceRange ||
        aiResult?.estimated_price;

    if (aiFairPrice) {
        return {
            text: String(aiFairPrice),
            source: "AI indicative estimate"
        };
    }

    return {
        text: "Not configured",
        source: "Cooperative price not provided"
    };
};


const getServiceAliases = (text = "") => {
    const value = String(text).toLowerCase();

    if (
        value.includes("plumb") ||
        value.includes("pipe") ||
        value.includes("leak") ||
        value.includes("tap") ||
        value.includes("fitting")
    ) {
        return [
            "plumb",
            "pipe",
            "leak",
            "tap",
            "fitting",
            "bathroom"
        ];
    }

    if (
        value.includes("electric") ||
        value.includes("wiring") ||
        value.includes("switch") ||
        value.includes("light")
    ) {
        return [
            "electric",
            "wire",
            "wiring",
            "switch",
            "light",
            "fan",
            "repair"
        ];
    }

    if (
        value.includes("clean") ||
        value.includes("housekeeping") ||
        value.includes("sanit")
    ) {
        return [
            "clean",
            "housekeeping",
            "sanit",
            "home"
        ];
    }

    if (
        value.includes("agri") ||
        value.includes("farm") ||
        value.includes("field") ||
        value.includes("labour") ||
        value.includes("labor")
    ) {
        return [
            "agri",
            "farm",
            "field",
            "labour",
            "labor",
            "harvest",
            "crop"
        ];
    }

    const words = value
        .split(/\s+/)
        .map((word) => word.replace(/[^a-z0-9]/g, ""))
        .filter((word) => word.length >= 4);

    return words;
};


const calculateMatchScore = (
    worker,
    aiResult,
    request
) => {
    const serviceText = [
        aiResult?.service,
        aiResult?.category,
        request
    ]
        .filter(Boolean)
        .join(" ");

    const aliases = getServiceAliases(serviceText);
    const skillsText = getWorkerSkills(worker)
        .join(" ")
        .toLowerCase();

    const workerLocation = String(
        worker.location || ""
    ).toLowerCase();

    const requestLocation = String(
        aiResult?.location || ""
    ).toLowerCase();

    const skillMatch = aliases.some((alias) =>
        skillsText.includes(alias)
    );

    const locationMatch =
        requestLocation &&
        workerLocation &&
        (
            workerLocation.includes(requestLocation) ||
            requestLocation.includes(workerLocation)
        );

    const available = isAvailable(worker);

    const rating = Number(
        worker.rating || worker.averageRating || 0
    );

    let score = 0;

    if (skillMatch) score += 55;
    if (available) score += 20;
    if (locationMatch) score += 15;
    score += Math.min(10, Math.max(0, rating * 2));

    return {
        score: Math.min(100, Math.round(score)),
        skillMatch,
        locationMatch: Boolean(locationMatch),
        available
    };
};


const getSocietyWorkers = (society) => {
    return Array.isArray(society?.workers)
        ? society.workers
        : [];
};


function CustomerDashboard() {

    const [request, setRequest] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const [cooperatives, setCooperatives] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [networkLoading, setNetworkLoading] = useState(true);
    const [networkError, setNetworkError] = useState("");
    const [selectedWorker, setSelectedWorker] = useState(null);


    useEffect(() => {
        let mounted = true;

        const loadCooperativeNetwork = async () => {
            try {
                setNetworkLoading(true);
                setNetworkError("");

                const token = localStorage.getItem("token");

                const response = await fetch(
                    "http://127.0.0.1:5000/api/cooperatives",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            ...(token
                                ? {
                                      Authorization: `Bearer ${token}`
                                  }
                                : {})
                        }
                    }
                );

                const responseText = await response.text();
                let data = {};

                try {
                    data = responseText
                        ? JSON.parse(responseText)
                        : {};
                } catch {
                    data = {};
                }

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        `Cooperative API failed (${response.status})`
                    );
                }

                const societies =
                    data?.cooperatives ||
                    data?.data ||
                    data ||
                    [];

                if (!Array.isArray(societies)) {
                    throw new Error(
                        "Cooperative API returned an invalid data format."
                    );
                }

                const results = await Promise.all(
                    societies
                        .filter((society) => society?._id)
                        .map(async (society) => {
                            try {
                                const workerResponse = await fetch(
                                    `http://127.0.0.1:5000/api/cooperatives/${society._id}/workers`,
                                    {
                                        method: "GET",
                                        headers: {
                                            "Content-Type":
                                                "application/json",
                                            ...(token
                                                ? {
                                                      Authorization: `Bearer ${token}`
                                                  }
                                                : {})
                                        }
                                    }
                                );

                                const workerText =
                                    await workerResponse.text();

                                let workerPayload = {};

                                try {
                                    workerPayload = workerText
                                        ? JSON.parse(workerText)
                                        : {};
                                } catch {
                                    workerPayload = {};
                                }

                                if (!workerResponse.ok) {
                                    throw new Error(
                                        workerPayload.message ||
                                        `Worker API failed (${workerResponse.status})`
                                    );
                                }

                                const workerData =
                                    workerPayload?.workers ||
                                    workerPayload?.data ||
                                    workerPayload ||
                                    [];

                                const societyWorkers =
                                    Array.isArray(workerData)
                                        ? workerData
                                        : [];

                                return {
                                    ...society,
                                    workers: societyWorkers.map(
                                        (worker) => ({
                                            ...worker,
                                            __cooperativeId:
                                                society._id,
                                            __cooperativeName:
                                                getSocietyName(society),
                                            __cooperativeVerified:
                                                normalizeStatus(
                                                    society.status ||
                                                    society.verificationStatus ||
                                                    society.verifiedStatus
                                                ) === "Verified"
                                        })
                                    )
                                };

                            } catch (workerError) {

                                console.error(
                                    `Worker loading error for ${society._id}:`,
                                    workerError
                                );

                                return {
                                    ...society,
                                    workers: []
                                };
                            }
                        })
                );

                if (!mounted) return;

                setCooperatives(results);

                setWorkers(
                    results.flatMap((society) =>
                        getSocietyWorkers(society)
                    )
                );

            } catch (err) {

                console.error(
                    "Cooperative network loading error:",
                    err
                );

                if (mounted) {
                    setNetworkError(
                        err.message ||
                        "Unable to connect to the cooperative API."
                    );
                }

            } finally {

                if (mounted) {
                    setNetworkLoading(false);
                }
            }
        };

        loadCooperativeNetwork();

        return () => {
            mounted = false;
        };

    }, []);


    const analyzeRequest = async () => {

        if (!request.trim()) {
            setError("Please describe the service you need.");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {

            const token = localStorage.getItem("token");

            const response = await api.post(
                "/ai/analyze",
                {
                    message: request
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const aiResult = response.data?.result;

            if (!aiResult) {
                throw new Error(
                    response.data?.message ||
                    "AI returned an empty result."
                );
            }

            setResult(aiResult);

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "Unable to connect with AI service."
            );

        } finally {
            setLoading(false);
        }
    };


    const matchedWorkers = useMemo(() => {

        if (!result || workers.length === 0) {
            return [];
        }

        return workers
            .map((worker) => ({
                ...worker,
                __match: calculateMatchScore(
                    worker,
                    result,
                    request
                )
            }))
            .filter(
                (worker) =>
                    worker.__match.skillMatch
            )
            .sort(
                (a, b) =>
                    b.__match.score -
                    a.__match.score
            )
            .slice(0, 6);

    }, [result, workers, request]);


    const matchedSocieties = useMemo(() => {

        if (!result || cooperatives.length === 0) {
            return [];
        }

        const matchedIds = new Set(
            matchedWorkers
                .map(
                    (worker) =>
                        worker.__cooperativeId
                )
                .filter(Boolean)
        );

        const societiesWithMatches =
            cooperatives
                .filter((society) =>
                    matchedIds.has(society._id)
                )
                .map((society) => {

                    const societyWorkers =
                        getSocietyWorkers(
                            society
                        ).filter((worker) =>
                            matchedWorkers.some(
                                (match) =>
                                    match._id ===
                                    worker._id
                            )
                        );

                    return {
                        ...society,
                        matchedWorkerCount:
                            societyWorkers.length
                    };
                })
                .sort(
                    (a, b) =>
                        b.matchedWorkerCount -
                        a.matchedWorkerCount
                );

        return societiesWithMatches;

    }, [result, cooperatives, matchedWorkers]);


    const scrollToSection = (id) => {
        document
            .getElementById(id)
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    };


    const services = [
        {
            icon: <Wrench size={23} />,
            title: "Plumbing",
            text: "Pipe repair, leakage & fittings"
        },
        {
            icon: <Zap size={23} />,
            title: "Electrical",
            text: "Wiring, switches & repairs"
        },
        {
            icon: <Droplets size={23} />,
            title: "Cleaning",
            text: "Home & community cleaning"
        },
        {
            icon: <Tractor size={23} />,
            title: "Agriculture",
            text: "Farm & field assistance"
        }
    ];


    return (
        <div className="customer-dashboard">

            {/* NAVBAR */}

            <nav className="dashboard-navbar">

                <div className="dashboard-brand">
                    <div className="brand-mark">
                        S
                    </div>

                    <div>
                        <h2>SkillDnest</h2>
                        <span>Local Skills, Trusted Services</span>
                    </div>
                </div>

                <div className="dashboard-location">
                    <MapPin size={18} />
                    <span>Find services near you</span>
                </div>

                <div className="dashboard-profile">
                    <div className="profile-circle">
                        C
                    </div>

                    <div>
                        <strong>Customer</strong>
                        <span>Welcome back</span>
                    </div>
                </div>

            </nav>


            {/* HERO */}

            <section className="dashboard-hero">

                <div className="hero-content">

                    <div className="ai-badge">
                        <span className="ai-robot-logo">
                            <Bot size={18} />
                        </span>
                        <span>SkillNest AI Service Matching</span>
                    </div>

                    <h1>
                        What service do you
                        <br />
                        <span>need today?</span>
                    </h1>

                    <p>
                        Describe your problem naturally. Our AI will
                        understand your requirement and help you find
                        the right local service.
                    </p>


                    {/* AI SEARCH BOX */}

                    <div className="ai-search-box">

                        <div
                            className="ai-robot-glow"
                            aria-hidden="true"
                        >
                            <Bot size={20} />
                        </div>

                        <div className="search-icon">
                            <Search size={23} />
                        </div>

                        <textarea
                            value={request}
                            onChange={(e) =>
                                setRequest(e.target.value)
                            }
                            placeholder="Example: My kitchen pipe is leaking and needs urgent repair..."
                        />

                        <button
                            onClick={analyzeRequest}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    Find Service
                                    <ArrowRight size={19} />
                                </>
                            )}
                        </button>

                    </div>

                    {error && (
                        <div className="ai-error">
                            {error}
                        </div>
                    )}

                    <div className="quick-text">
                        Try:

                        <button
                            onClick={() =>
                                setRequest(
                                    "My kitchen pipe is leaking and needs urgent repair"
                                )
                            }
                        >
                            Pipe leakage
                        </button>

                        <button
                            onClick={() =>
                                setRequest(
                                    "I need an electrician for house wiring"
                                )
                            }
                        >
                            Electrical work
                        </button>

                        <button
                            onClick={() =>
                                setRequest(
                                    "I need workers for agricultural field work"
                                )
                            }
                        >
                            Farm work
                        </button>

                    </div>

                </div>


                {/* HERO IMAGE */}

                <div className="hero-image">

                    <div className="image-glow"></div>

                    <img
                        src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=85"
                        alt="Local service worker"
                    />

                    <div className="floating-stat stat-one">
                        <ShieldCheck size={18} />

                        <div>
                            <strong>Verified</strong>
                            <span>Local Workers</span>
                        </div>
                    </div>

                    <div className="floating-stat stat-two">
                        <Star size={18} />

                        <div>
                            <strong>4.8/5</strong>
                            <span>Average Rating</span>
                        </div>
                    </div>

                </div>

            </section>


            {/* AI RESULT */}

            {result && (

                <section className="ai-result-section">

                    <div className="section-heading">

                        <div>

                            <div className="mini-label">
                                <Sparkles size={15} />
                                AI ANALYSIS
                            </div>

                            <h2>
                                We understood your requirement
                            </h2>

                        </div>

                        <div className="ai-success">
                            <ShieldCheck size={17} />
                            AI Analysis Complete
                        </div>

                    </div>


                    <div className="result-grid">

                        <div className="result-card">
                            <span>Service</span>

                            <strong>
                                {result.service || "—"}
                            </strong>
                        </div>

                        <div className="result-card">
                            <span>Category</span>

                            <strong>
                                {result.category || "—"}
                            </strong>
                        </div>

                        <div className="result-card">
                            <span>Location</span>

                            <strong>
                                {result.location || "—"}
                            </strong>
                        </div>

                        <div className="result-card priority-card">
                            <span>Priority</span>

                            <strong>
                                {result.priority || "—"}
                            </strong>
                        </div>

                        <div className="result-card">
                            <span>Estimated Duration</span>

                            <strong>
                                {result.duration || "—"}
                            </strong>
                        </div>

                    </div>


                    <div className="ai-fair-price-note">

                        <CircleDollarSign size={18} />

                        <div>

                            <strong>
                                Fair-price visibility
                            </strong>

                            <span>
                                {result.fairPrice ||
                                    result.estimatedPrice ||
                                    result.priceRange ||
                                    "Prices are shown from cooperative data when configured."}
                            </span>

                        </div>

                    </div>

                </section>

            )}


            {/* AI MATCHING RESULTS */}

            {result && (

                <section
                    className="ai-matching-section"
                    id="ai-matching-section"
                >

                    <div className="section-heading ai-matching-heading">

                        <div>

                            <div className="mini-label">
                                <Sparkles size={15} />
                                SMART MATCHING
                            </div>

                            <h2>
                                Best local matches for your request
                            </h2>

                            <p>
                                We matched your requirement with available
                                cooperative workers using service, availability,
                                location and rating signals.
                            </p>

                        </div>

                        <div className="ai-match-meta">

                            {networkLoading
                                ? "Loading local network..."
                                : `${matchedWorkers.length} matches found`}

                        </div>

                    </div>


                    {networkError && (
                        <div className="network-inline-error">
                            {networkError}
                        </div>
                    )}


                    {!networkLoading &&
                        matchedWorkers.length === 0 && (

                            <div className="no-match-card">

                                <Search size={30} />

                                <h3>
                                    No exact worker match found yet
                                </h3>

                                <p>
                                    Try a service description with a clearer
                                    skill, such as plumber, electrician,
                                    cleaner or agriculture worker.
                                </p>

                            </div>
                        )}


                    {matchedWorkers.length > 0 && (

                        <div className="ai-match-grid">

                            {matchedWorkers.map((worker, index) => {

                                const priceInfo =
                                    getPriceInfo(
                                        worker,
                                        result
                                    );

                                const workerName =
                                    worker.name ||
                                    worker.fullName ||
                                    worker.workerName ||
                                    `Worker ${index + 1}`;

                                const skills =
                                    getWorkerSkills(worker);

                                const rating = Number(
                                    worker.rating ||
                                    worker.averageRating ||
                                    0
                                );

                                return (

                                    <article
                                        className="ai-match-card"
                                        key={
                                            worker._id ||
                                            `${workerName}-${index}`
                                        }
                                    >

                                        <div className="ai-match-top">

                                            <div className="match-avatar">

                                                {worker.photo ? (

                                                    <img
                                                        src={worker.photo}
                                                        alt={workerName}
                                                    />

                                                ) : (

                                                    <UserRound size={26} />

                                                )}

                                            </div>

                                            <div className="match-score">
                                                <Sparkles size={13} />
                                                {worker.__match.score}% match
                                            </div>

                                        </div>


                                        <div className="ai-match-body">

                                            <div className="match-name-row">

                                                <div>

                                                    <h3>
                                                        {workerName}
                                                    </h3>

                                                    <p>
                                                        {skills.join(", ") ||
                                                            "Skilled Professional"}
                                                    </p>

                                                </div>

                                                {worker.__cooperativeVerified && (

                                                    <BadgeCheck
                                                        size={20}
                                                        className="verified-icon"
                                                        title="Verified cooperative"
                                                    />

                                                )}

                                            </div>


                                            <div className="match-details">

                                                <span>
                                                    <MapPin size={14} />

                                                    {worker.location ||
                                                        "Local network"}
                                                </span>


                                                <span>

                                                    {isAvailable(worker) ? (

                                                        <>
                                                            <CheckCircle2
                                                                size={14}
                                                            />
                                                            Available now
                                                        </>

                                                    ) : (

                                                        <>
                                                            <Clock3
                                                                size={14}
                                                            />
                                                            Availability
                                                            varies
                                                        </>

                                                    )}

                                                </span>


                                                <span>

                                                    <Star size={14} />

                                                    {rating > 0
                                                        ? `${rating.toFixed(1)}/5`
                                                        : "New worker"}

                                                </span>

                                            </div>


                                            <div className="fair-price-box">

                                                <div>

                                                    <CircleDollarSign
                                                        size={18}
                                                    />

                                                    <div>

                                                        <span>
                                                            Fair Price
                                                        </span>

                                                        <strong>
                                                            {
                                                                priceInfo.text
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>

                                                <small>
                                                    {
                                                        priceInfo.source
                                                    }
                                                </small>

                                            </div>


                                            <div className="match-reasons">

                                                {worker.__match.skillMatch && (

                                                    <span>

                                                        <CheckCircle2
                                                            size={13}
                                                        />

                                                        Skill matched

                                                    </span>

                                                )}

                                                {worker.__match.locationMatch && (

                                                    <span>

                                                        <CheckCircle2
                                                            size={13}
                                                        />

                                                        Nearby

                                                    </span>

                                                )}

                                                {worker.__match.available && (

                                                    <span>

                                                        <CheckCircle2
                                                            size={13}
                                                        />

                                                        Available

                                                    </span>

                                                )}

                                            </div>

                                        </div>


                                        <div className="ai-match-footer">

                                            <span>
                                                {worker.__cooperativeName ||
                                                    "Cooperative network"}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedWorker(
                                                        worker
                                                    )
                                                }
                                            >
                                                View details

                                                <ChevronRight
                                                    size={15}
                                                />

                                            </button>

                                        </div>

                                    </article>

                                );
                            })}

                        </div>

                    )}

                </section>

            )}


            {/* MATCHED COOPERATIVE SOCIETIES */}

            {result && matchedSocieties.length > 0 && (

                <section
                    className="matched-societies-section"
                    id="matched-societies-section"
                >

                    <div className="section-heading">

                        <div>

                            <div className="mini-label">
                                <Building2 size={15} />
                                AI-RECOMMENDED SOCIETIES
                            </div>

                            <h2>
                                Cooperatives relevant to your request
                            </h2>

                            <p>
                                These societies have workers matching the
                                service identified from your request.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="view-all"
                            onClick={() =>
                                scrollToSection(
                                    "cooperative-network-section"
                                )
                            }
                        >
                            View all societies
                            <ArrowRight size={17} />
                        </button>

                    </div>


                    <div className="matched-societies-grid">

                        {matchedSocieties.map((society) => {

                            const societyWorkers =
                                getSocietyWorkers(society);

                            const verified =
                                normalizeStatus(
                                    society.status ||
                                    society.verificationStatus ||
                                    society.verifiedStatus
                                ) === "Verified";

                            const availableCount =
                                societyWorkers.filter((worker) =>
                                    isAvailable(worker)
                                ).length;

                            const priceInfo =
                                societyWorkers
                                    .map((worker) =>
                                        getPriceInfo(
                                            worker,
                                            result
                                        )
                                    )
                                    .find(
                                        (price) =>
                                            price.text !==
                                            "Not configured"
                                    );

                            return (

                                <article
                                    key={society._id}
                                    className="matched-society-card"
                                >

                                    <div className="matched-society-header">

                                        <div className="society-icon">
                                            <Building2 size={22} />
                                        </div>

                                        {verified && (

                                            <span className="verified-pill">
                                                <ShieldCheck size={13} />
                                                Verified
                                            </span>

                                        )}

                                    </div>


                                    <h3>
                                        {getSocietyName(society)}
                                    </h3>


                                    <p className="society-location">

                                        <MapPin size={14} />

                                        {getSocietyLocation(society)}

                                    </p>


                                    <div className="matched-society-stats">

                                        <div>

                                            <strong>
                                                {society.matchedWorkerCount ||
                                                    0}
                                            </strong>

                                            <span>
                                                matched workers
                                            </span>

                                        </div>


                                        <div>

                                            <strong>
                                                {availableCount}
                                            </strong>

                                            <span>
                                                available
                                            </span>

                                        </div>

                                    </div>


                                    <div className="society-price">

                                        <CircleDollarSign size={17} />

                                        <div>

                                            <span>
                                                Fair price
                                            </span>

                                            <strong>
                                                {priceInfo?.text ||
                                                    "Not configured"}
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="matched-society-actions">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                scrollToSection(
                                                    "cooperative-network-section"
                                                )
                                            }
                                        >
                                            View society
                                            <ChevronRight size={15} />
                                        </button>

                                    </div>

                                </article>

                            );
                        })}

                    </div>

                </section>

            )}


            {/* COOPERATIVE NETWORK */}

            <section
                className="cooperative-network-section"
                id="cooperative-network-section"
            >

                <div className="section-heading">

                    <div>

                        <div className="mini-label">
                            <Building2 size={15} />
                            COOPERATIVE NETWORK
                        </div>

                        <h2>
                            Trusted local societies
                        </h2>

                        <p>
                            Discover workers through verified cooperative
                            societies instead of dealing with unknown
                            service providers.
                        </p>

                    </div>

                    <div className="network-summary">

                        <strong>
                            {cooperatives.length}
                        </strong>

                        <span>
                            societies connected
                        </span>

                    </div>

                </div>


                {networkLoading ? (

                    <div className="network-loading-card">

                        <span className="spinner"></span>

                        Loading cooperative network...

                    </div>

                ) : cooperatives.length === 0 ? (

                    <div className="no-match-card">

                        <Building2 size={30} />

                        <h3>
                            Cooperative network is currently empty
                        </h3>

                        <p>
                            Once societies register workers, they will appear
                            here for customers to discover.
                        </p>

                    </div>

                ) : (

                    <div className="cooperative-network-grid">

                        {cooperatives.slice(0, 6).map((society) => {

                            const societyWorkers =
                                getSocietyWorkers(
                                    society
                                );

                            const verified =
                                normalizeStatus(
                                    society.status ||
                                    society.verificationStatus ||
                                    society.verifiedStatus
                                ) === "Verified";

                            const societySkills =
                                Array.from(
                                    new Set(
                                        societyWorkers.flatMap(
                                            (worker) =>
                                                getWorkerSkills(worker)
                                        )
                                    )
                                ).slice(0, 4);

                            const availableCount =
                                societyWorkers.filter(
                                    (worker) =>
                                        isAvailable(worker)
                                ).length;

                            const societyPrice =
                                societyWorkers
                                    .map((worker) =>
                                        getPriceInfo(
                                            worker,
                                            result
                                        )
                                    )
                                    .find(
                                        (price) =>
                                            price.text !==
                                            "Not configured"
                                    );

                            return (

                                <article
                                    className="cooperative-network-card"
                                    key={society._id}
                                >

                                    <div className="society-card-top">

                                        <div className="society-icon">
                                            <Building2 size={23} />
                                        </div>

                                        {verified && (

                                            <span className="verified-pill">
                                                <ShieldCheck size={13} />
                                                Verified
                                            </span>

                                        )}

                                    </div>


                                    <h3>
                                        {getSocietyName(society)}
                                    </h3>


                                    <p className="society-location">

                                        <MapPin size={14} />

                                        {getSocietyLocation(
                                            society
                                        )}

                                    </p>


                                    <div className="society-metrics">

                                        <div>

                                            <Users size={16} />

                                            <strong>
                                                {societyWorkers.length}
                                            </strong>

                                            <span>
                                                workers
                                            </span>

                                        </div>


                                        <div>

                                            <CheckCircle2 size={16} />

                                            <strong>
                                                {availableCount}
                                            </strong>

                                            <span>
                                                available
                                            </span>

                                        </div>

                                    </div>


                                    <div className="society-services">

                                        {societySkills.length > 0 ? (

                                            societySkills.map(
                                                (skill) => (

                                                    <span
                                                        key={skill}
                                                    >
                                                        {skill}
                                                    </span>

                                                )
                                            )

                                        ) : (

                                            <span>
                                                Local skilled services
                                            </span>

                                        )}

                                    </div>


                                    <div className="society-price">

                                        <CircleDollarSign
                                            size={17}
                                        />

                                        <div>

                                            <span>
                                                Fair price
                                            </span>

                                            <strong>
                                                {societyPrice?.text ||
                                                    "Not configured"}
                                            </strong>

                                        </div>

                                    </div>

                                </article>
                            );
                        })}

                    </div>

                )}

            </section>


            {/* SELECTED WORKER DETAILS */}

            {selectedWorker && (

                <div
                    className="worker-modal-backdrop"
                    onClick={() =>
                        setSelectedWorker(null)
                    }
                >

                    <div
                        className="worker-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="worker-modal-close"
                            onClick={() =>
                                setSelectedWorker(null)
                            }
                            aria-label="Close worker details"
                        >
                            ×
                        </button>


                        <div className="worker-modal-header">

                            <div className="modal-worker-avatar">

                                {selectedWorker.photo ? (

                                    <img
                                        src={
                                            selectedWorker.photo
                                        }
                                        alt={
                                            selectedWorker.name ||
                                            "Worker"
                                        }
                                    />

                                ) : (

                                    <UserRound size={28} />

                                )}

                            </div>


                            <div>

                                <h3>
                                    {selectedWorker.name ||
                                        "Skilled Worker"}
                                </h3>

                                <p>
                                    {
                                        selectedWorker.__cooperativeName ||
                                        "Cooperative network"
                                    }
                                </p>

                            </div>

                        </div>


                        <div className="worker-modal-grid">

                            <div>

                                <span>
                                    Skills
                                </span>

                                <strong>
                                    {getWorkerSkills(
                                        selectedWorker
                                    ).join(", ") ||
                                        "Not specified"}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Location
                                </span>

                                <strong>
                                    {
                                        selectedWorker.location ||
                                        "Local network"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Experience
                                </span>

                                <strong>
                                    {selectedWorker.experience
                                        ? `${selectedWorker.experience} years`
                                        : "Not specified"}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Availability
                                </span>

                                <strong>

                                    {isAvailable(
                                        selectedWorker
                                    )
                                        ? "Available"
                                        : "Not available"}

                                </strong>

                            </div>

                        </div>


                        <div className="modal-price-highlight">

                            <CircleDollarSign size={21} />

                            <div>

                                <span>
                                    Fair Price
                                </span>

                                <strong>
                                    {
                                        getPriceInfo(
                                            selectedWorker,
                                            result
                                        ).text
                                    }
                                </strong>

                            </div>

                        </div>


                        <div className="modal-trust-note">

                            <ShieldCheck size={18} />

                            <span>
                                Worker is connected through a cooperative
                                network. Final price can be confirmed before
                                booking.
                            </span>

                        </div>

                    </div>

                </div>

            )}


            {/* SERVICES */}

            <section className="services-section">

                <div className="section-heading">

                    <div>

                        <div className="mini-label">
                            SERVICES
                        </div>

                        <h2>
                            Explore local services
                        </h2>

                    </div>

                    <button className="view-all">
                        View all
                        <ArrowRight size={17} />
                    </button>

                </div>


                <div className="service-grid">

                    {services.map((service, index) => (

                        <div
                            className="service-card"
                            key={index}
                        >

                            <div className="service-icon">
                                {service.icon}
                            </div>

                            <div>
                                <h3>{service.title}</h3>
                                <p>{service.text}</p>
                            </div>

                            <ArrowRight
                                className="service-arrow"
                                size={18}
                            />

                        </div>

                    ))}

                </div>

            </section>


            {/* COOPERATIVE PREVIEW */}

            <section className="cooperative-section">

                <div className="cooperative-image">

                    <img
                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85"
                        alt="Cooperative agriculture"
                    />

                </div>

                <div className="cooperative-content">

                    <div className="mini-label">

                        <Building2 size={16} />

                        COOPERATIVE NETWORK

                    </div>

                    <h2>
                        Trusted workers from
                        <span> local societies</span>
                    </h2>

                    <p>
                        Compare services, prices and verified workers
                        from different cooperative societies before
                        booking.
                    </p>

                    <div className="cooperative-stats">

                        <div>
                            <Users size={21} />
                            <strong>Verified Workers</strong>
                        </div>

                        <div>
                            <ShieldCheck size={21} />
                            <strong>Trusted Societies</strong>
                        </div>

                        <div>
                            <Clock3 size={21} />
                            <strong>Quick Response</strong>
                        </div>

                    </div>

                    <button
                        className="explore-btn"
                        onClick={() =>
                            scrollToSection(
                                "cooperative-network-section"
                            )
                        }
                    >
                        Explore Cooperatives
                        <ArrowRight size={18} />
                    </button>

                </div>

            </section>


            <footer className="dashboard-footer">
                <strong>SkillDnest</strong>
                <span>Local Skills, Trusted Services</span>
            </footer>

        </div>
    );
}

export default CustomerDashboard;