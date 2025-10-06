import { useEffect, useState, useMemo } from "react";
import { getMyTrips } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal";
import { formatDate } from "../../utils/formatters";
import { FaRoute } from "react-icons/fa";

const formatDateSafe = (date) => {
  const d = new Date(date);
  if (isNaN(d)) return "-";
  return formatDate(d);
};


function DestinationsModal({ isOpen, onClose, destinations }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trip Destinations" size="md">
      {Array.isArray(destinations) && destinations.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {destinations.map((d, idx) => {
            const lat = typeof d.lat === "number" ? d.lat.toFixed(4) : "-";
            const lng = typeof d.lng === "number" ? d.lng.toFixed(4) : "-";
            return (
              <div key={idx} className="p-2 rounded bg-base-100 border">
                <p className="font-semibold">{d.name || "-"}</p>
                <p className="text-sm text-gray-500">
                  {lat}, {lng}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No destinations available.</p>
      )}
      <div className="mt-4 text-right">
        <button className="btn btn-outline" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

export default function MyTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [modalOpen, setModalOpen] = useState(false);
  const [destModalOpen, setDestModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getMyTrips(user.id)
      .then((data) => setTrips(data))
      .catch(() => console.error("Failed to load trips"))
      .finally(() => setLoading(false));
  }, [user]);

  const filteredAndPaginatedTrips = useMemo(() => {
    let filtered = trips.filter((trip) => {
      const lastDest = trip.destinations?.[trip.destinations.length - 1]?.name || "";

      const matchesSearch =
        lastDest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trip.status?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (trip.reason?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (trip.vehicle?.plate_number?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (trip.requester?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        formatDateSafe(trip.start_time).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || trip.status === statusFilter;

      const tripDate = trip.start_time ? new Date(trip.start_time).toISOString().split("T")[0] : "";
      const matchesDate = !dateFilter || tripDate === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    return { filtered, paginated: filtered.slice(startIndex, startIndex + itemsPerPage) };
  }, [trips, searchTerm, statusFilter, dateFilter, currentPage]);

  const totalPages = Math.ceil(filteredAndPaginatedTrips.filtered.length / itemsPerPage);

  const handleView = (trip) => {
    setSelectedTrip(trip);
    setModalOpen(true);
  };

  const handleDestinations = (trip) => {
    setSelectedTrip(trip);
    setDestModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const classes = {
      completed: "badge-success",
      active: "badge-info",
      in_progress: "badge-warning",
      cancelled: "badge-error",
    };
    return <span className={`badge ${classes[status] || "badge-info"}`}>{status}</span>;
  };

  return (
    <div className="min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold mb-6">My Trips</h1>

        <div className="bg-base-100 rounded-lg shadow-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-sm font-semibold">Search</span>
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-sm font-semibold">Status</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-sm font-semibold">Date</span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12">
              <FaRoute className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p>No trips found</p>
            </div>
          ) : filteredAndPaginatedTrips.filtered.length === 0 ? (
            <div className="text-center py-12">
              <FaRoute className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p>No trips match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="text-sm text-gray-600">
                    <th className="w-1/3">Reason</th>
                    <th className="w-1/4">Date</th>
                    <th className="w-1/6">Status</th>
                    <th className="w-1/4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndPaginatedTrips.paginated.map((trip, idx) => (
                    <tr key={idx}>
                      <td>{trip.reason || "-"}</td>
                      <td>{formatDateSafe(trip.start_time)}</td>
                      <td>{getStatusBadge(trip.status)}</td>
                      <td className="text-center space-x-2">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleView(trip)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => handleDestinations(trip)}
                        >
                          Destinations
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`btn btn-sm btn-square ${
                        currentPage === i + 1 ? "btn-active" : ""
                      }`}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Trip Details"
          size="lg"
          footer={
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Close
            </button>
          }
        >
          {selectedTrip && (
            <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3 text-primary">Trip Info</h3>
                <p><strong>Date:</strong> {formatDateSafe(selectedTrip.start_time)}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedTrip.status)}</p>
                <p><strong>Reason:</strong> {selectedTrip.reason || "-"}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-primary">Requester & Vehicle</h3>
                <p><strong>Requester:</strong> {selectedTrip.requester?.name || "-"}</p>
                <p><strong>Vehicle:</strong> {selectedTrip.vehicle?.plate_number || "-"}</p>
              </div>
            </div>
          )}
        </Modal>

        <DestinationsModal
          isOpen={destModalOpen}
          onClose={() => setDestModalOpen(false)}
          destinations={selectedTrip?.destinations}
        />
      </div>
    </div>
  );
}
