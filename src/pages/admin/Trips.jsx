import { useEffect, useState, useMemo } from "react";
import TripCard from "../../components/TripCard";
import Modal from "../../components/Modal";
import {
  FaSearch,
  FaExclamationTriangle,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaRoute,
  FaUserFriends,
  FaCar,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import { getTrips, updateTripStatus } from "../../api/api";

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const itemsPerPage = 6;

  useEffect(() => {
    const loadTrips = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await getTrips({ id: null }, "admin");
        if (error) throw error;
        setTrips(data || []);
      } catch (err) {
        console.error("Failed to load trips:", err.message);
        setError("Failed to load trips");
      } finally {
        setLoading(false);
      }
    };
    loadTrips();
  }, []);

  const filteredAndPaginatedTrips = useMemo(() => {
    let filtered = trips;

    if (searchTerm) {
      filtered = filtered.filter(
        (trip) =>
          trip.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.vehicle?.plate_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          trip.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.requester?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          trip.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((trip) => trip.status === statusFilter);
    }

    if (vehicleFilter) {
      filtered = filtered.filter((trip) =>
        trip.vehicle?.plate_number
          ?.toLowerCase()
          .includes(vehicleFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      const selectedDate = new Date(dateFilter);
      filtered = filtered.filter((trip) => {
        if (!trip.start_time) return false;
        const tripDate = new Date(trip.start_time);
        return (
          tripDate.getFullYear() === selectedDate.getFullYear() &&
          tripDate.getMonth() === selectedDate.getMonth() &&
          tripDate.getDate() === selectedDate.getDate()
        );
      });
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { filtered, paginated };
  }, [trips, searchTerm, statusFilter, vehicleFilter, dateFilter, currentPage]);

  const totalPages = Math.ceil(
    filteredAndPaginatedTrips.filtered.length / itemsPerPage
  );

  const handleView = (trip) => {
    setSelectedTrip(trip);
    setModalOpen(true);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const handleApprove = async () => {
    if (!selectedTrip) return;
    setStatusUpdating(true);
    try {
      await updateTripStatus(selectedTrip.id, "approved");
      setTrips(
        trips.map((t) =>
          t.id === selectedTrip.id ? { ...t, status: "approved" } : t
        )
      );
      setSelectedTrip({ ...selectedTrip, status: "approved" });
    } catch (err) {
      console.error("Failed to approve trip:", err);
      alert("Failed to approve trip");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeny = async (reason) => {
    if (!selectedTrip) return;
    setStatusUpdating(true);
    try {
      await updateTripStatus(selectedTrip.id, "cancelled", reason);
      setTrips(
        trips.map((t) =>
          t.id === selectedTrip.id
            ? { ...t, status: "cancelled", deny_reason: reason }
            : t
        )
      );
      setSelectedTrip({
        ...selectedTrip,
        status: "cancelled",
        deny_reason: reason,
      });
    } catch (err) {
      console.error("Failed to deny trip:", err);
      alert("Failed to deny trip");
    } finally {
      setStatusUpdating(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages)
      startPage = Math.max(1, endPage - maxVisiblePages + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <input
          key={i}
          className="join-item btn btn-square"
          type="radio"
          name="options"
          aria-label={i.toString()}
          checked={currentPage === i}
          onChange={() => handlePageChange(i)}
        />
      );
    }
    return (
      <div className="join">
        {currentPage > 1 && (
          <button
            className="join-item btn btn-square"
            onClick={() => handlePageChange(currentPage - 1)}
          >
            «
          </button>
        )}
        {pages}
        {currentPage < totalPages && (
          <button
            className="join-item btn btn-square"
            onClick={() => handlePageChange(currentPage + 1)}
          >
            »
          </button>
        )}
      </div>
    );
  };

  const tripStats = useMemo(
    () => ({
      total: trips.length,
      requested: trips.filter((t) => t.status === "requested").length,
      approved: trips.filter((t) => t.status === "approved").length,
      active: trips.filter((t) => t.status === "in_progress").length,
      completed: trips.filter((t) => t.status === "completed").length,
      cancelled: trips.filter((t) => t.status === "cancelled").length,
    }),
    [trips]
  );

  return (
    <div className="min-h-[92vh] bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-base-content mb-4 sm:mb-0">
            Trip Management
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { icon: FaRoute, label: "Total Trips", value: tripStats.total },
            { icon: FaClock, label: "Requested", value: tripStats.requested },
            { icon: FaCalendarAlt, label: "Approved", value: tripStats.approved },
            { icon: FaCar, label: "In Progress", value: tripStats.active },
            { icon: FaMapMarkerAlt, label: "Completed", value: tripStats.completed },
            { icon: FaUserFriends, label: "Cancelled", value: tripStats.cancelled },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="stat bg-base-100 rounded-lg p-4 shadow-sm"
            >
              <div className="stat-figure text-primary">
                <Icon className="w-6 h-6" />
              </div>
              <div className="stat-title">{label}</div>
              <div className="stat-value text-secondary text-lg">{value}</div>
            </div>
          ))}
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Search</span>
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="input input-bordered w-full pl-10 focus:input-primary"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Vehicle</span>
            </label>
            <input
              type="text"
              placeholder="Plate number"
              value={vehicleFilter}
              onChange={(e) => {
                setVehicleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-bordered w-full focus:input-primary"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Status</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="select select-bordered w-full focus:select-primary"
            >
              <option value="">All</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Date</span>
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-bordered w-full focus:input-primary"
            />
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4 sm:p-6 mb-10">
          {error && (
            <div className="alert alert-error mb-6 shadow-lg">
              <FaExclamationTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : filteredAndPaginatedTrips.filtered.length === 0 ? (
            <div className="text-center py-12">
              <FaInfoCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 font-medium mb-2">
                {searchTerm || statusFilter || vehicleFilter || dateFilter
                  ? "No trips match your filters"
                  : "No trips found"}
              </p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setVehicleFilter("");
                  setDateFilter("");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-base-content opacity-70">
                Showing {filteredAndPaginatedTrips.paginated.length} of{" "}
                {filteredAndPaginatedTrips.filtered.length} trips
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {filteredAndPaginatedTrips.paginated.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onView={() => handleView(trip)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  {renderPagination()}
                </div>
              )}
            </>
          )}
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selectedTrip ? `Trip Details: ${selectedTrip.reason || selectedTrip.id}` : ""}
          size="max-w-4xl"
        >
          {selectedTrip && (
            <div className="flex flex-col lg:flex-row gap-6 max-h-[70vh] overflow-y-auto">
              <div className="flex-1 flex flex-col gap-6">
                <section className="pr-4">
                  <h3 className="font-bold text-lg mb-4 text-primary flex items-center gap-2">
                    <FaInfoCircle /> Trip Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-sm">Status:</label>
                      <div className="mt-1">
                        <span className={`badge ${
                          selectedTrip.status === 'completed' ? 'badge-success' :
                          selectedTrip.status === 'approved' ? 'badge-success' :
                          selectedTrip.status === 'active' ? 'badge-info' :
                          selectedTrip.status === 'requested' ? 'badge-info' :
                          selectedTrip.status === 'pending' ? 'badge-warning' :
                          selectedTrip.status === 'cancelled' ? 'badge-error' :
                          'badge-warning'
                        }`}>
                          {selectedTrip.status || "-"}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="font-semibold text-sm">ID:</label>
                      <p className="mt-1 font-mono text-sm break-all">{selectedTrip.id || "-"}</p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="font-semibold text-sm">Reason:</label>
                      <p className="mt-1 bg-base-100 p-2 rounded">{selectedTrip.reason || "-"}</p>
                    </div>
                    
                    <div>
                      <label className="font-semibold text-sm">Distance:</label>
                      <p className="mt-1">{selectedTrip.distance_travelled ? `${selectedTrip.distance_travelled} km` : "-"}</p>
                    </div>
                    
                    <div>
                      <label className="font-semibold text-sm">Start Time:</label>
                      <p className="mt-1 text-sm">{selectedTrip.start_time ? new Date(selectedTrip.start_time).toLocaleString() : "-"}</p>
                    </div>
                    
                    <div>
                      <label className="font-semibold text-sm">End Time:</label>
                      <p className="mt-1 text-sm">{selectedTrip.end_time ? new Date(selectedTrip.end_time).toLocaleString() : "-"}</p>
                    </div>
                  </div>
                </section>

                <section className="pr-4">
                  <h3 className="font-bold text-lg mb-4 text-primary flex items-center gap-2">
                    <FaCar /> Vehicle Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-sm">Plate Number:</label>
                      <p className="mt-1">{selectedTrip.vehicle?.plate_number || "-"}</p>
                    </div>
                    
                    <div>
                      <label className="font-semibold text-sm">Make/Model:</label>
                      <p className="mt-1">{selectedTrip.vehicle?.make || "-"} {selectedTrip.vehicle?.model || ""}</p>
                    </div>
                    
                    <div>
                      <label className="font-semibold text-sm">Year:</label>
                      <p className="mt-1">{selectedTrip.vehicle?.year || "-"}</p>
                    </div>
                    
                    <div>
                      <label className="font-semibold text-sm">Odometer:</label>
                      <p className="mt-1">{selectedTrip.vehicle?.odometer ? `${selectedTrip.vehicle.odometer} km` : "-"}</p>
                    </div>
                  </div>
                </section>

                <section className="pr-4">
                  <h3 className="font-bold text-lg mb-4 text-primary flex items-center gap-2">
                    <FaUserFriends /> People Involved
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-sm">Driver:</label>
                      <p className="mt-1">{selectedTrip.driver?.name || "-"}</p>
                    </div>
                    
                    <div>
                      <label className="font-semibold text-sm">Requester:</label>
                      <p className="mt-1">{selectedTrip.requester?.name || "-"}</p>
                    </div>
                    
                    {selectedTrip.deny_reason && (
                      <div className="md:col-span-2">
                        <label className="font-semibold text-sm">Deny Reason:</label>
                        <p className="mt-1 text-error bg-base-100 p-2 rounded">{selectedTrip.deny_reason}</p>
                      </div>
                    )}
                  </div>
                </section>

                {selectedTrip.route_points?.length > 0 && (
                  <section className="pr-4">
                    <h3 className="font-bold text-lg mb-4 text-primary flex items-center gap-2">
                      <FaMapMarkerAlt /> Route Points
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedTrip.route_points.map((p, index) => (
                        <div key={p.id} className="bg-base-100 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{p.name || `Point ${index + 1}`}</p>
                              <p className="text-sm opacity-70 mt-1">({p.lat}, {p.lng})</p>
                              {p.point_time && (
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(p.point_time).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-2">
                              {p.is_start && <span className="badge badge-success badge-sm">Start</span>}
                              {p.is_destination && <span className="badge badge-info badge-sm">Destination</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}

          {selectedTrip && selectedTrip.status === "requested" && (
            <div className="flex gap-4 mt-6 pt-4 border-t border-base-300">
              <button
                className={`btn btn-success ${statusUpdating ? "loading" : ""}`}
                onClick={handleApprove}
                disabled={statusUpdating}
              >
                Approve
              </button>
              <button
                className={`btn btn-error ${statusUpdating ? "loading" : ""}`}
                onClick={() => {
                  const reason = prompt("Enter reason for denial:");
                  if (reason) handleDeny(reason);
                }}
                disabled={statusUpdating}
              >
                Deny
              </button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
