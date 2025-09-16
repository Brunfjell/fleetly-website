import { useEffect, useState, useMemo } from "react";
import { getMyTrips } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/DataTable";
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
        <ul className="list-disc ml-4 space-y-1">
          {destinations.map((d, idx) => {
            const lat = typeof d.lat === "number" ? d.lat.toFixed(4) : "-";
            const lng = typeof d.lng === "number" ? d.lng.toFixed(4) : "-";
            return (
              <li key={idx}>
                {d.name || "-"} ({lat}, {lng})
              </li>
            );
          })}
        </ul>
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
  const [modalOpen, setModalOpen] = useState(false);
  const [destModalOpen, setDestModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (user) {
      setLoading(true);
      getMyTrips(user.id)
        .then((data) => setTrips(data))
        .catch(() => console.error("Failed to load trips"))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filteredAndPaginatedTrips = useMemo(() => {
    const filtered = trips.filter((trip) => {
      const lastDest = trip.destinations?.[trip.destinations.length - 1]?.name || "";
      return (
        lastDest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trip.status?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (trip.reason?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (trip.vehicle?.plate_number?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (trip.driver?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        formatDateSafe(trip.start_time).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { filtered, paginated };
  }, [trips, searchTerm, currentPage]);

  const totalPages = Math.ceil(filteredAndPaginatedTrips.filtered.length / itemsPerPage);

  const handleView = (trip) => {
    setSelectedTrip(trip);
    setModalOpen(true);
  };

  const handleDestinations = (trip) => {
    setSelectedTrip(trip);
    setDestModalOpen(true);
  };

  const clearSearch = () => setSearchTerm("");
  const handlePageChange = (page) => setCurrentPage(page);

  const getStatusBadge = (status) => {
    const classes = {
      completed: "badge-success",
      active: "badge-info",
      pending: "badge-warning",
      cancelled: "badge-error",
    };
    return <span className={`badge ${classes[status] || "badge-info"}`}>{status}</span>;
  };

  const columns = ["id", "date", "status"];
  const rows = filteredAndPaginatedTrips.paginated.map((t) => ({
    id: t.id,
    date: formatDateSafe(t.start_time),
    destination: t.destinations?.[t.destinations.length - 1]?.name || "-",
    status: getStatusBadge(t.status),
    tripObject: t, 
  }));

  return (
    <div className="min-h-[80vh] bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold text-base-content mb-6">My Trips</h1>

        <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Search My Trips</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by destination, status, reason, vehicle, or date..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-bordered w-full pl-3 focus:input-primary"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12">
              <FaRoute className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 font-medium mb-4">No trips found</p>
            </div>
          ) : filteredAndPaginatedTrips.filtered.length === 0 ? (
            <div className="text-center py-12">
              <FaRoute className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 font-medium mb-4">No trips match your search</p>
              <button className="btn btn-outline" onClick={clearSearch}>
                Clear Search
              </button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              actions={[
                {
                  label: "View",
                  className: "btn btn-sm btn-primary",
                  onClick: (row) => handleView(row.tripObject),
                },
                {
                  label: "Destinations",
                  className: "btn btn-sm btn-info",
                  onClick: (row) => handleDestinations(row.tripObject),
                },
              ]}
            />
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-3 text-primary">Trip Information</h3>
                  <p>
                    <strong>Date:</strong> {formatDateSafe(selectedTrip.start_time)}
                  </p>
                  <p>
                    <strong>Status:</strong> {getStatusBadge(selectedTrip.status)}
                  </p>
                  <p>
                    <strong>Reason:</strong> {selectedTrip.reason || "No reason provided"}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3 text-primary">Location & Vehicle</h3>
                  <p>
                    <strong>Vehicle:</strong> {selectedTrip.vehicle?.plate_number || "-"}
                  </p>
                  <p>
                    <strong>Driver:</strong> {selectedTrip.driver?.name || "-"}
                  </p>
                </div>
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
