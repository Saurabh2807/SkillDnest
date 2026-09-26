import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  LogOut,
  ShieldCheck,
  Users,
  Wrench,
  CalendarCheck,
  MapPin,
  Phone,
  Building2,
  CheckCircle2,
  Plus,
  ArrowRight,
  Leaf,
  UserRound,
  BriefcaseBusiness,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Bell,
  ChevronRight,
  Star,
  TrendingUp,
  Clock3,
  Settings,
  Eye,
} from "lucide-react";

import api from "../services/api";
import "./CooperativeDashboard.css";

/* =========================================
   SERVICE IMAGES
========================================= */

const serviceImages = {
  plumber:
    "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1000&q=85",

  electrician:
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=85",

  carpenter:
    "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=1000&q=85",

  painter:
    "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1000&q=85",

  cleaner:
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1000&q=85",

  mechanic:
    "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1000&q=85",

  tutor:
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=85",

  driver:
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1000&q=85",

  agriculture:
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1000&q=85",

  general:
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85",
};


/* =========================================
   SERVICE HELPERS
========================================= */

const getServiceKey = (service = "") => {
  const value = String(service).toLowerCase();

  if (value.includes("plumb")) return "plumber";
  if (value.includes("electric")) return "electrician";
  if (value.includes("carpent")) return "carpenter";
  if (value.includes("paint")) return "painter";
  if (value.includes("clean")) return "cleaner";
  if (value.includes("mechan")) return "mechanic";
  if (value.includes("tutor") || value.includes("teach")) {
    return "tutor";
  }

  if (value.includes("driver") || value.includes("driv")) {
    return "driver";
  }

  if (
    value.includes("agri") ||
    value.includes("farm") ||
    value.includes("labour") ||
    value.includes("labor")
  ) {
    return "agriculture";
  }

  return "general";
};


const getServiceImage = (service) => {
  return serviceImages[getServiceKey(service)];
};


const getServiceIcon = (service) => {
  const key = getServiceKey(service);

  const icons = {
    plumber: Wrench,
    electrician: Wrench,
    carpenter: BriefcaseBusiness,
    painter: BriefcaseBusiness,
    cleaner: Sparkles,
    mechanic: Wrench,
    tutor: UserRound,
    driver: BriefcaseBusiness,
    agriculture: Leaf,
    general: BriefcaseBusiness,
  };

  return icons[key] || BriefcaseBusiness;
};


const normalizeStatus = (status) => {
  if (!status) return "Pending";

  const value = String(status).toLowerCase();

  if (
    value.includes("verif") ||
    value.includes("approv")
  ) {
    return "Verified";
  }

  if (value.includes("reject")) {
    return "Rejected";
  }

  return "Pending";
};


/* =========================================
   COMPONENT
========================================= */

function CooperativeDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [society, setSociety] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");


  /* =========================================
     LOAD SOCIETY + WORKERS
  ========================================= */

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/cooperatives");

        const societies =
          response.data?.cooperatives ||
          response.data?.data ||
          response.data ||
          [];

        const user = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        const currentSociety =
          societies.find(
            (item) =>
              item.phone &&
              item.phone === user.phone
          ) ||
          societies.find(
            (item) =>
              item._id &&
              user.cooperativeId &&
              item._id === user.cooperativeId
          ) ||
          societies[0] ||
          null;

        if (!mounted) return;

        setSociety(currentSociety);

        if (currentSociety?._id) {
          try {
            const workerResponse = await api.get(
              `/cooperatives/${currentSociety._id}/workers`
            );

            if (!mounted) return;

            const workerData =
              workerResponse.data?.workers ||
              workerResponse.data?.data ||
              workerResponse.data ||
              [];

            setWorkers(
              Array.isArray(workerData)
                ? workerData
                : []
            );
          } catch (workerError) {
            console.error(
              "Worker loading error:",
              workerError
            );

            if (mounted) {
              setWorkers([]);
            }
          }
        } else {
          setWorkers([]);
        }
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        if (mounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load cooperative dashboard."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [location.key]);


  /* =========================================
     ACTIONS
  ========================================= */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/cooperative-login");
  };


  const handleAddWorker = () => {
    navigate("/add-worker", {
      state: {
        cooperativeId: society?._id,
      },
    });
  };


  const handleWorkerManagement = () => {
    navigate("/worker-management", {
      state: {
        cooperativeId: society?._id,
      },
    });
  };


  const scrollToSection = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };


  const handleRefresh = () => {
    window.location.reload();
  };


  /* =========================================
     FILTER WORKERS
  ========================================= */

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return workers;

    return workers.filter((worker) => {
      const name = String(
        worker.name ||
          worker.fullName ||
          worker.workerName ||
          ""
      ).toLowerCase();

      const skill = String(
        worker.skill ||
          worker.skills ||
          worker.service ||
          worker.category ||
          ""
      ).toLowerCase();

      const phone = String(
        worker.phone || ""
      ).toLowerCase();

      return (
        name.includes(query) ||
        skill.includes(query) ||
        phone.includes(query)
      );
    });
  }, [workers, search]);


  /* =========================================
     SERVICES
  ========================================= */

  const services = useMemo(() => {
    const serviceSet = new Set();

    workers.forEach((worker) => {
      const skill =
        worker.skill ||
        worker.skills ||
        worker.service ||
        worker.category;

      if (Array.isArray(skill)) {
        skill.forEach((item) => {
          if (item) {
            serviceSet.add(String(item));
          }
        });
      } else if (skill) {
        serviceSet.add(String(skill));
      }
    });

    const defaultServices = [
      "Plumber",
      "Electrician",
      "Carpenter",
      "Painter",
      "Cleaner",
      "Mechanic",
      "Tutor",
      "Driver",
      "Agriculture Labour",
    ];

    if (serviceSet.size === 0) {
      return defaultServices;
    }

    return Array.from(serviceSet);
  }, [workers]);


  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return services;

    return services.filter((service) =>
      service
        .toLowerCase()
        .includes(query)
    );
  }, [services, search]);


  /* =========================================
     DASHBOARD DATA
  ========================================= */

  const verificationStatus = normalizeStatus(
    society?.status ||
      society?.verificationStatus ||
      society?.verifiedStatus
  );

  const isVerified =
    verificationStatus === "Verified";

  const totalWorkers = workers.length;

  const totalServices = services.length;

  const totalBookings = 0;

  const opportunityScore = Math.min(
    100,
    40 +
      totalWorkers * 5 +
      totalServices * 5 +
      (isVerified ? 20 : 0)
  );


  const societyName =
    society?.name ||
    society?.societyName ||
    society?.cooperativeName ||
    "Your Cooperative Society";


  const societyPhone =
    society?.phone ||
    "Not available";


  const societyLocation =
    society?.location ||
    society?.address ||
    society?.city ||
    "Local community";


  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-card">

          <div className="loading-logo">
            S
          </div>

          <div className="loading-spinner">
            <RefreshCw size={22} />
          </div>

          <h2>Loading SkillNest</h2>

          <p>
            Preparing your cooperative dashboard...
          </p>

        </div>
      </div>
    );
  }


  /* =========================================
     MAIN UI
  ========================================= */

  return (
    <div className="cooperative-dashboard">

      {/* =====================================
          NAVBAR
      ===================================== */}

      <header className="dashboard-navbar">

        <div className="navbar-left">

          <button
            className="brand"
            onClick={() =>
              navigate(
                "/cooperative-dashboard"
              )
            }
          >
            <div className="brand-logo">
              S
            </div>

            <div>
              <div className="brand-name">
                SkillNest
              </div>

              <div className="brand-tagline">
                Cooperative Services Network
              </div>
            </div>
          </button>

        </div>


        <div className="navbar-center">

          <div className="dashboard-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search workers or services..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                className="search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}

          </div>

        </div>


        <div className="navbar-right">

          <div className="portal-label">
            <Building2 size={17} />
            <span>
              Cooperative Portal
            </span>
          </div>

          <button
            className="nav-icon-btn"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className="notification-dot"></span>
          </button>

          <button
            className="logout-btn"
            onClick={logout}
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </header>


      {/* =====================================
          MAIN
      ===================================== */}

      <main className="dashboard-main">

        {/* ERROR */}

        {error && (
          <div className="dashboard-error">

            <div>
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>

            <button
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
              Retry
            </button>

          </div>
        )}


        {/* WELCOME */}

        <section className="dashboard-welcome-strip">

          <div>

            <div className="welcome-small">
              COOPERATIVE MANAGEMENT
            </div>

            <h1>
              Welcome to{" "}
              <span>{societyName}</span>
            </h1>

            <p>
              Manage your skilled workforce
              and connect local talent with
              new opportunities.
            </p>

          </div>


          <div className="welcome-actions">

            <button
              className="secondary-dashboard-btn"
              onClick={handleWorkerManagement}
            >
              <Users size={17} />
              View Workers
            </button>

            <button
              className="primary-dashboard-btn"
              onClick={handleAddWorker}
            >
              <Plus size={18} />
              Add Worker
            </button>

          </div>

        </section>


        {/* =====================================
            HERO
        ===================================== */}

        <section className="dashboard-hero">

          <div className="hero-content">

            <div className="hero-badge">
              <Sparkles size={15} />
              Empowering Local Skills
            </div>

            <h2>
              Turn local skills into
              <br />
              <span>
                local opportunities.
              </span>
            </h2>

            <p>
              SkillNest helps cooperative
              societies give their workers
              better visibility, trusted
              digital identities and fair
              access to service opportunities.
            </p>

            <div className="hero-actions">

              <button
                className="hero-primary-btn"
                onClick={handleAddWorker}
              >
                <Plus size={17} />
                Register New Worker
              </button>

              <button
                className="hero-secondary-btn"
                onClick={() =>
                  scrollToSection(
                    "services-section"
                  )
                }
              >
                Explore Services
                <ArrowRight size={17} />
              </button>

            </div>

          </div>


          <div className="hero-visual">

            <img
              src="https://up.yimg.com/ib/th/id/OIP.IXqQCrv0h7ksygnnXzv1FgHaG0?pid=Api&rs=1&c=1&qlt=95&w=123&h=113"
              alt="Agriculture and local workers"
            />

            <div className="hero-floating-card">

              <div className="floating-icon">
                <ShieldCheck size={21} />
              </div>

              <div>
                <strong>
                  Trusted Network
                </strong>

                <span>
                  Verified cooperative workers
                </span>
              </div>

            </div>

          </div>

        </section>


        {/* =====================================
            STATS
        ===================================== */}

        <section className="dashboard-stats">

          <div className="stat-card">

            <div className="stat-icon green">
              <ShieldCheck size={22} />
            </div>

            <div>
              <span>
                Verification
              </span>

              <strong>
                {isVerified
                  ? "Verified"
                  : "Pending"}
              </strong>
            </div>

            <CheckCircle2
              className="stat-check"
              size={19}
            />

          </div>


          <div className="stat-card">

            <div className="stat-icon blue">
              <Users size={22} />
            </div>

            <div>
              <span>
                Registered Workers
              </span>

              <strong>
                {totalWorkers}
              </strong>
            </div>

            <TrendingUp
              className="stat-check"
              size={19}
            />

          </div>


          <div className="stat-card">

            <div className="stat-icon orange">
              <Wrench size={22} />
            </div>

            <div>
              <span>
                Services Available
              </span>

              <strong>
                {totalServices}
              </strong>
            </div>

            <ChevronRight
              className="stat-check"
              size={19}
            />

          </div>


          <div className="stat-card">

            <div className="stat-icon purple">
              <CalendarCheck size={22} />
            </div>

            <div>
              <span>
                Total Bookings
              </span>

              <strong>
                {totalBookings}
              </strong>
            </div>

            <Clock3
              className="stat-check"
              size={19}
            />

          </div>

        </section>


        {/* =====================================
            QUICK ACTIONS
        ===================================== */}

        <section className="quick-actions-section">

          <div className="section-heading">

            <div>

              <span className="section-kicker">
                QUICK ACTIONS
              </span>

              <h2>
                Manage your cooperative
              </h2>

            </div>

          </div>


          <div className="quick-actions-grid">

            <button
              className="quick-action-card"
              onClick={handleAddWorker}
            >
              <div className="quick-action-icon">
                <Plus size={22} />
              </div>

              <div>
                <strong>
                  Add a Worker
                </strong>

                <span>
                  Register a skilled worker
                </span>
              </div>

              <ArrowRight size={18} />
            </button>


            <button
              className="quick-action-card"
              onClick={handleWorkerManagement}
            >
              <div className="quick-action-icon">
                <Users size={22} />
              </div>

              <div>
                <strong>
                  Manage Workers
                </strong>

                <span>
                  View your registered workforce
                </span>
              </div>

              <ArrowRight size={18} />
            </button>


            <button
              className="quick-action-card"
              onClick={() =>
                scrollToSection(
                  "services-section"
                )
              }
            >
              <div className="quick-action-icon">
                <Wrench size={22} />
              </div>

              <div>
                <strong>
                  Explore Services
                </strong>

                <span>
                  See available local skills
                </span>
              </div>

              <ArrowRight size={18} />
            </button>


            <button
              className="quick-action-card"
              type="button"
            >
              <div className="quick-action-icon">
                <Settings size={22} />
              </div>

              <div>
                <strong>
                  Society Settings
                </strong>

                <span>
                  Manage cooperative details
                </span>
              </div>

              <ArrowRight size={18} />
            </button>

          </div>

        </section>


        {/* =====================================
            SOCIETY INFORMATION
        ===================================== */}

        <section className="society-section">

          <div className="section-heading">

            <div>

              <span className="section-kicker">
                YOUR COOPERATIVE
              </span>

              <h2>
                Society information
              </h2>

            </div>


            <div
              className={`verification-pill ${
                isVerified
                  ? "verified"
                  : "pending"
              }`}
            >
              <ShieldCheck size={16} />
              {verificationStatus}
            </div>

          </div>


          <div className="society-info-card">

            <div className="society-profile">

              <div className="society-avatar">
                <Building2 size={28} />
              </div>

              <div>

                <h3>
                  {societyName}
                </h3>

                <p>
                  Cooperative service
                  organization
                </p>

                <div className="society-mini-tags">

                  <span>
                    <MapPin size={13} />
                    {societyLocation}
                  </span>

                  <span>
                    <Phone size={13} />
                    {societyPhone}
                  </span>

                </div>

              </div>

            </div>


            <div className="verification-box">

              <div className="verification-top">

                <div className="verification-icon">
                  <ShieldCheck size={22} />
                </div>

                <div>

                  <strong>
                    {isVerified
                      ? "Society Verified"
                      : "Verification Pending"}
                  </strong>

                  <span>
                    {isVerified
                      ? "Your cooperative is part of the trusted SkillNest network."
                      : "Complete verification to unlock full platform benefits."}
                  </span>

                </div>

              </div>


              <div className="verification-divider"></div>


              <div className="verification-bottom">
                <CheckCircle2 size={17} />

                <span>
                  Digital cooperative identity
                </span>
              </div>

            </div>

          </div>

        </section>


        {/* =====================================
            SERVICES
        ===================================== */}

        <section
          className="services-section"
          id="services-section"
        >

          <div className="section-heading">

            <div>

              <span className="section-kicker">
                SERVICE NETWORK
              </span>

              <h2>
                Skills available in your network
              </h2>

              <p>
                Make local skills easier for
                customers to discover and book.
              </p>

            </div>

          </div>


          <div className="services-grid">

            {filteredServices.map(
              (service) => {

                const Icon =
                  getServiceIcon(service);

                return (
                  <div
                    className="service-card"
                    key={service}
                  >

                    <div className="service-image">

                      <img
                        src={getServiceImage(
                          service
                        )}
                        alt={service}
                        loading="lazy"
                      />

                      <div className="service-icon-badge">
                        <Icon size={18} />
                      </div>

                    </div>


                    <div className="service-content">

                      <div className="service-title-line">

                        <h3>
                          {service}
                        </h3>

                        <span className="service-rating">
                          <Star size={13} />
                          4.8
                        </span>

                      </div>


                      <p>
                        Skilled workers
                        available through
                        your cooperative.
                      </p>


                      <button
                        type="button"
                        onClick={() =>
                          setSearch(service)
                        }
                      >
                        Find workers
                        <ChevronRight size={15} />
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>


        {/* =====================================
            AI INSIGHT
        ===================================== */}

        <section className="ai-insight-card">

          <div className="ai-insight-icon">
            <Sparkles size={25} />
          </div>

          <div className="ai-insight-content">

            <span>
              AI-POWERED INSIGHT
            </span>

            <h3>
              Grow your cooperative's
              opportunity network
            </h3>

            <p>
              SkillNest can use worker skills,
              availability and service demand
              to help cooperatives identify new
              opportunities and improve worker
              visibility.
            </p>

          </div>


          <div className="ai-score-circle">

            <strong>
              {opportunityScore}
            </strong>

            <span>
              Network
              <br />
              Score
            </span>

          </div>

        </section>


        {/* =====================================
            WORKERS
        ===================================== */}

        <section
          className="workers-section"
          id="workers-section"
        >

          <div className="section-heading">

            <div>

              <span className="section-kicker">
                WORKFORCE
              </span>

              <h2>
                Your cooperative workers
              </h2>

              <p>
                A digital identity for every
                skilled worker.
              </p>

            </div>


            <button
              className="primary-dashboard-btn"
              onClick={handleAddWorker}
            >
              <Plus size={17} />
              Add Worker
            </button>

          </div>


          {filteredWorkers.length === 0 ? (

            <div className="empty-workers-card">

              <div className="empty-workers-icon">
                <Users size={28} />
              </div>

              <h3>
                No workers found
              </h3>

              <p>
                {search
                  ? "Try a different worker name or skill."
                  : "Start building your cooperative workforce by adding your first worker."}
              </p>

              {!search && (
                <button
                  className="primary-dashboard-btn"
                  onClick={handleAddWorker}
                >
                  <Plus size={17} />
                  Add First Worker
                </button>
              )}

            </div>

          ) : (

            <div className="workers-grid">

              {filteredWorkers.map(
                (worker, index) => {

                  const workerName =
                    worker.name ||
                    worker.fullName ||
                    worker.workerName ||
                    `Worker ${index + 1}`;

                  const workerSkill =
                    worker.skill ||
                    worker.skills ||
                    worker.service ||
                    worker.category ||
                    "Skilled Professional";

                  const workerPhone =
                    worker.phone ||
                    "Phone not available";

                  const workerStatus =
                    normalizeStatus(
                      worker.status ||
                        worker.verificationStatus
                    );

                  return (
                    <div
                      className="worker-card"
                      key={
                        worker._id || index
                      }
                    >

                      <div className="worker-card-top">

                        <div className="worker-avatar">
                          <UserRound size={25} />
                        </div>

                        <div className="worker-status">
                          <CheckCircle2 size={13} />
                          {workerStatus}
                        </div>

                      </div>


                      <div className="worker-card-body">

                        <h3>
                          {workerName}
                        </h3>

                        <p className="worker-skill">
                          {Array.isArray(
                            workerSkill
                          )
                            ? workerSkill.join(
                                ", "
                              )
                            : workerSkill}
                        </p>

                        <div className="worker-info-row">
                          <Phone size={14} />
                          <span>
                            {workerPhone}
                          </span>
                        </div>

                        <div className="worker-info-row">
                          <MapPin size={14} />
                          <span>
                            {worker.location ||
                              "Local cooperative network"}
                          </span>
                        </div>

                      </div>


                      <div className="worker-card-footer">

                        <div className="worker-rating">
                          <Star size={14} />

                          <strong>
                            {worker.rating ||
                              "New"}
                          </strong>
                        </div>


                        <button
                          className="worker-view-btn"
                          type="button"
                        >
                          <Eye size={15} />
                          View
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>


        {/* =====================================
            NETWORK OVERVIEW
        ===================================== */}

        <section className="network-overview-section">

          <div className="section-heading">

            <div>

              <span className="section-kicker">
                COOPERATIVE IMPACT
              </span>

              <h2>
                Your network at a glance
              </h2>

            </div>

          </div>


          <div className="network-overview-grid">

            <div className="network-overview-card">

              <div className="network-card-heading">

                <div className="network-card-icon">
                  <Users size={20} />
                </div>

                <span>
                  Worker Coverage
                </span>

              </div>

              <div className="network-number">
                {totalWorkers}
                <small>
                  workers
                </small>
              </div>

              <p>
                Skilled people represented
                by your cooperative.
              </p>

              <div className="network-progress">

                <div className="progress-label">
                  <span>
                    Network strength
                  </span>

                  <strong>
                    {Math.min(
                      100,
                      totalWorkers * 10
                    )}
                    %
                  </strong>
                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        totalWorkers * 10
                      )}%`,
                    }}
                  ></div>

                </div>

              </div>

            </div>


            <div className="network-overview-card">

              <div className="network-card-heading">

                <div className="network-card-icon">
                  <Wrench size={20} />
                </div>

                <span>
                  Skill Diversity
                </span>

              </div>

              <div className="network-number">
                {totalServices}
                <small>
                  services
                </small>
              </div>

              <p>
                Different skill categories
                customers can discover.
              </p>

              <div className="network-location">

                <MapPin
                  size={17}
                  className="location-icon"
                />

                <span>
                  {societyLocation}
                </span>

              </div>

            </div>


            <div className="network-overview-card">

              <div className="network-card-heading">

                <div className="network-card-icon">
                  <TrendingUp size={20} />
                </div>

                <span>
                  Opportunity Score
                </span>

              </div>

              <div className="network-number">
                {opportunityScore}
                <small>
                  /100
                </small>
              </div>

              <p>
                Demo indicator based on your
                cooperative's current network.
              </p>

              <div className="impact-items">

                <span>
                  <CheckCircle2 size={14} />
                  Worker visibility
                </span>

                <span>
                  <CheckCircle2 size={14} />
                  Service diversity
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================
            BOTTOM CTA
        ===================================== */}

        <section className="dashboard-bottom-banner">

          <div className="bottom-banner-content">

            <div className="bottom-banner-badge">
              <Leaf size={16} />
              Built for local communities
            </div>

            <h2>
              Every skill deserves
              <br />
              an opportunity.
            </h2>

            <p>
              Connect your cooperative workforce
              with customers who need trusted
              local services.
            </p>

          </div>


          <div className="bottom-banner-actions">

            <button
              className="primary-dashboard-btn"
              onClick={handleAddWorker}
            >
              <Plus size={17} />
              Add Worker
            </button>

            <button
              className="secondary-dashboard-btn"
              onClick={handleWorkerManagement}
            >
              View Workforce
              <ArrowRight size={17} />
            </button>

          </div>

        </section>

      </main>


      {/* =====================================
          FOOTER
      ===================================== */}

      <footer className="dashboard-footer">

        <div className="footer-brand">

          <div className="brand-logo">
            S
          </div>

          <div>

            <strong>
              SkillNest
            </strong>

            <span>
              Cooperative Gig Services
              Platform
            </span>

          </div>

        </div>


        <div className="footer-center">
          Empowering local skills through
          technology.
        </div>


        <div className="footer-right">

          <span>Secure</span>
          <span>Trusted</span>
          <span>Community First</span>

        </div>

      </footer>

    </div>
  );
}

export default CooperativeDashboard;