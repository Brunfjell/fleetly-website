import { useEffect, useState, useMemo } from "react";
import { getMyTrips } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/DataTable";
import { formatDate } from "../../utils/formatters";
import { FaSearch, FaExclamationTriangle, FaRoute, FaInfoCircle } from "react-icons/fa";

export default function MyTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (user) {
      const loadTrips = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getMyTrips(user.id);
          setTrips(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Failed to load trips:", err);
          setError("Failed to load your trips");
        } finally {
          setLoading(false);
        }
      };
      loadTrips();
    }
  }, [user]);

  const filteredAndPaginatedTrips = useMemo(() => {
    const filtered = trips.filter(trip => 
      trip.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(trip.date)?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
    
    return { filtered, paginated };
  }, [trips, searchTerm, currentPage]);

  const totalPages = Math.ceil(filteredAndPaginatedTrips.filtered.length / itemsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

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

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: "badge-success",
      active: "badge-info",
      pending: "badge-warning",
      cancelled: "badge-error",
    };
    
    return (
      <span className={`badge ${statusClasses[status] || 'badge-info'}`}>
        {status}
      </span>
    );
  };

  const columns = ["Date", "Destination", "Status"];
  const rows = filteredAndPaginatedTrips.paginated.map((t) => [
    formatDate(t.date),
    t.destination || "-",
    getStatusBadge(t.status || "-"),
  ]);

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-base-content mb-4 sm:mb-0">
            My Trips
          </h1>
        </div>

        <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Search My Trips</span>
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by destination, status, or date..."
                value={searchTerm}
                onChange={handleSearch}
                className="input input-bordered w-full pl-10 focus:input-primary"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="text-sm text-base-content opacity-70 mt-2">
                Showing {filteredAndPaginatedTrips.paginated.length} of {filteredAndPaginatedTrips.filtered.length} trips
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            )}
          </div>
        </div>

        <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6">
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
          ) : trips.length === 0 ? (
            <div className="text-center py-12">
              <FaRoute className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 font-medium mb-4">No trips found</p>
              <p className="text-base-content opacity-70">You haven't taken any trips yet.</p>
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
            <>
              <DataTable columns={columns} rows={rows} />
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  {renderPagination()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}