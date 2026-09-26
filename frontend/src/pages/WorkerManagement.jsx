import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  User,
  Phone,
  MapPin,
  Briefcase,
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Users,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";
import "./WorkerManagement.css";

function WorkerManagement() {
  const navigate = useNavigate();
  const location = useLocation();

  const cooperativeId =
    location.state?.cooperativeId ||
    localStorage.getItem("cooperativeId") ||
    "";

  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(Boolean(cooperativeId));
  const [error, setError] = useState(
    cooperativeId ? "" : "Cooperative ID not found."
  );

  useEffect(() => {
    if (!cooperativeId) {
      return;
    }

    const fetchWorkers = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await api.get(
          `/workers/cooperative/${cooperativeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setWorkers(response.data);
        setError("");
      } catch (err) {
        console.error("Error fetching workers:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load workers."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [cooperativeId]);

  const handleDelete = async (workerId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this worker?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await api.delete(`/workers/${workerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWorkers((prev) =>
        prev.filter((worker) => worker._id !== workerId)
      );

      alert("Worker removed successfully!");
    } catch (err) {
      console.error("Delete error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to remove worker."
      );
    }
  };

  const filteredWorkers = workers.filter((worker) => {
    const searchText = search.toLowerCase();

    return (
      worker.name?.toLowerCase().includes(searchText) ||
      worker.phone?.includes(searchText) ||
      worker.location?.toLowerCase().includes(searchText) ||
      worker.skills?.some((skill) =>
        skill.toLowerCase().includes(searchText)
      )
    );
  });

  return (
    <div className="worker-management-page">

      {/* Header */}
      <header className="worker-header">

        <button
          className="back-btn"
          onClick={() =>
            navigate("/cooperative-dashboard")
          }
        >
          <ArrowLeft size={19} />
          Back to Dashboard
        </button>

        <div className="security-badge">
          <ShieldCheck size={17} />
          Verified Cooperative
        </div>

      </header>

      {/* Main */}
      <main className="worker-container">

        {/* Intro */}
        <section className="worker-intro">

          <div className="worker-title-icon">
            <Users size={30} />
          </div>

          <div>
            <h1>Worker Management</h1>

            <p>
              Manage your cooperative workers, skills,
              availability and service information.
            </p>
          </div>

        </section>

        {/* Stats */}
        <section className="worker-stats">

          <div className="stat-card">
            <div className="stat-icon">
              <Users size={22} />
            </div>

            <div>
              <span>Total Workers</span>
              <strong>{workers.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={22} />
            </div>

            <div>
              <span>Available</span>
              <strong>
                {
                  workers.filter(
                    (worker) => worker.availability === true
                  ).length
                }
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Briefcase size={22} />
            </div>

            <div>
              <span>Skills</span>
              <strong>
                {
                  new Set(
                    workers.flatMap(
                      (worker) => worker.skills || []
                    )
                  ).size
                }
              </strong>
            </div>
          </div>

        </section>

        {/* Search */}
        <section className="worker-toolbar">

          <div className="search-box">

            <Search size={20} />

            <input
              type="text"
              placeholder="Search worker, skill, phone or location..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <button
            className="add-worker-btn"
            onClick={() =>
              navigate("/add-worker", {
                state: { cooperativeId },
              })
            }
          >
            + Add Worker
          </button>

        </section>

        {/* Loading */}
        {loading && (
          <div className="state-box">
            <div className="loader"></div>
            <p>Loading workers...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="state-box error-state">
            <XCircle size={30} />
            <p>{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredWorkers.length === 0 && (
            <div className="state-box">

              <Users size={42} />

              <h3>No workers found</h3>

              <p>
                {search
                  ? "Try a different search."
                  : "Add your first cooperative worker."}
              </p>

            </div>
          )}

        {/* Worker Cards */}
        {!loading &&
          !error &&
          filteredWorkers.length > 0 && (
            <section className="worker-grid">

              {filteredWorkers.map((worker) => (
                <div
                  className="worker-card"
                  key={worker._id}
                >

                  {/* Worker Top */}
                  <div className="worker-card-top">

                    <div className="worker-avatar">

                      {worker.photo ? (
                        <img
                          src={worker.photo}
                          alt={worker.name}
                        />
                      ) : (
                        <User size={30} />
                      )}

                    </div>

                    <div className="worker-main-info">

                      <h3>{worker.name}</h3>

                      <p>
                        <Phone size={14} />
                        {worker.phone || "No phone"}
                      </p>

                    </div>

                  </div>

                  {/* Availability */}
                  <div
                    className={
                      worker.availability
                        ? "availability available"
                        : "availability unavailable"
                    }
                  >
                    {worker.availability ? (
                      <>
                        <CheckCircle size={15} />
                        Available
                      </>
                    ) : (
                      <>
                        <XCircle size={15} />
                        Not Available
                      </>
                    )}
                  </div>

                  {/* Worker Info */}
                  <div className="worker-info">

                    <div className="info-row">

                      <Briefcase size={17} />

                      <div>
                        <span>Skills</span>

                        <p>
                          {worker.skills?.length
                            ? worker.skills.join(", ")
                            : "Not specified"}
                        </p>
                      </div>

                    </div>

                    <div className="info-row">

                      <MapPin size={17} />

                      <div>
                        <span>Location</span>

                        <p>
                          {worker.location ||
                            "Location not added"}
                        </p>
                      </div>

                    </div>

                    <div className="info-row">

                      <Star size={17} />

                      <div>
                        <span>Experience</span>

                        <p>
                          {worker.experience
                            ? `${worker.experience} years`
                            : "Not specified"}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Actions */}
                  <div className="worker-actions">

                    <button
                      className="edit-btn"
                      onClick={() =>
                        navigate("/edit-worker", {
                          state: {
                            worker,
                            cooperativeId,
                          },
                        })
                      }
                    >
                      <Edit size={16} />
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(worker._id)
                      }
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>

                  </div>

                </div>
              ))}

            </section>
          )}

      </main>
    </div>
  );
}

export default WorkerManagement;