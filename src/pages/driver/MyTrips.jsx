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

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
        (trip.driver?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        formatDateSafe(trip.start_time).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || trip.status === statusFilter;

      const tripDate = trip.start_time ? new Date(trip.start_time) : null;
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDate = (!start || (tripDate && tripDate >= start)) && (!end || (tripDate && tripDate <= end));

      return matchesSearch && matchesStatus && matchesDate;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    return { filtered, paginated: filtered.slice(startIndex, startIndex + itemsPerPage) };
  }, [trips, searchTerm, statusFilter, startDate, endDate, currentPage]);

  const totalPages = Math.ceil(filteredAndPaginatedTrips.filtered.length / itemsPerPage);

  const handleView = (trip) => { setSelectedTrip(trip); setModalOpen(true); };
  const handleDestinations = (trip) => { setSelectedTrip(trip); setDestModalOpen(true); };
  const clearFilters = () => { setSearchTerm(""); setStatusFilter("all"); setStartDate(""); setEndDate(""); setCurrentPage(1); };
  const handlePageChange = (page) => setCurrentPage(page);

  const getStatusBadge = (status) => {
    const classes = { completed: "badge-success", active: "badge-info", in_progress: "badge-warning", cancelled: "badge-error" };
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
        <h1 className="text-3xl font-bold mb-6">My Trips</h1>

        <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="input input-bordered w-full"/>
          
          <select className="select select-bordered" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input type="date" className="input input-bordered" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} placeholder="Start Date"/>
          <input type="date" className="input input-bordered" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} placeholder="End Date"/>
        </div>

        <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12"><FaRoute className="w-16 h-16 mx-auto text-gray-400 mb-4"/><p>No trips found</p></div>
          ) : filteredAndPaginatedTrips.filtered.length === 0 ? (
            <div className="text-center py-12"><FaRoute className="w-16 h-16 mx-auto text-gray-400 mb-4"/><p>No trips match your filters</p><button className="btn btn-outline mt-4" onClick={clearFilters}>Clear Filters</button></div>
          ) : (
            <>
              <DataTable columns={columns} data={rows} actions={[
                { label: "View", className: "btn btn-sm btn-primary", onClick: (row) => handleView(row.tripObject) },
                { label: "Destinations", className: "btn btn-sm btn-info", onClick: (row) => handleDestinations(row.tripObject) },
              ]}/>
            </>
          )}
        </div>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Trip Details" size="lg" footer={<button className="btn btn-outline" onClick={() => setModalOpen(false)}>Close</button>}>
          {selectedTrip && (
            <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3 text-primary">Trip Info</h3>
                <p><strong>Date:</strong> {formatDateSafe(selectedTrip.start_time)}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedTrip.status)}</p>
                <p><strong>Reason:</strong> {selectedTrip.reason || "-"}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-primary">Location & Vehicle</h3>
                <p><strong>Vehicle:</strong> {selectedTrip.vehicle?.plate_number || "-"}</p>
                <p><strong>Driver:</strong> {selectedTrip.driver?.name || "-"}</p>
              </div>
            </div>
          )}
        </Modal>

        <DestinationsModal isOpen={destModalOpen} onClose={() => setDestModalOpen(false)} destinations={selectedTrip?.destinations} />
      </div>
    </div>
  );
}
