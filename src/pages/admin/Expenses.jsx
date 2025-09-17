import { useEffect, useState, useMemo } from "react";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { supabase } from "../../api/supabaseClient";
import { FaExclamationTriangle, FaMoneyBill, FaEye, FaDownload, 
  FaChartBar, FaTag, FaCalendarAlt, FaReceipt 
} from "react-icons/fa";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    reportedBy: "",
    date: "",
    amount: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    avgMonthlyExpense: 0,
    prominentType: { type: "", avgAmount: 0, count: 0 },
    totalExpenses: 0,
    currentMonthExpense: 0,
    totalAmount: 0
  });
  const [proofImageUrl, setProofImageUrl] = useState(null);
  const itemsPerPage = 6;

  // Load expenses from Supabase
  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          id,
          trip_id,
          type,
          amount,
          reason,
          proof_url,
          created_at,
          reported_by:profiles!expenses_reported_by_fkey(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error("Failed to load expenses:", err.message);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (expensesData) => {
    if (!expensesData.length) return;
    
    const totalAmount = expensesData.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const firstExpense = new Date(expensesData[expensesData.length - 1].created_at);
    const lastExpense = new Date(expensesData[0].created_at);
    const monthDiff = Math.max(1, (lastExpense.getMonth() - firstExpense.getMonth()) + 
      (12 * (lastExpense.getFullYear() - firstExpense.getFullYear())));
    const avgMonthlyExpense = totalAmount / monthDiff;

    const now = new Date();
    const currentMonthExpense = expensesData
      .filter(e => {
        const d = new Date(e.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const typeStats = {};
    expensesData.forEach(e => {
      if (!typeStats[e.type]) typeStats[e.type] = { total: 0, count: 0 };
      typeStats[e.type].total += parseFloat(e.amount);
      typeStats[e.type].count += 1;
    });

    let prominentType = { type: "", avgAmount: 0, count: 0 };
    for (const type in typeStats) {
      const avgAmount = typeStats[type].total / typeStats[type].count;
      if (typeStats[type].count > prominentType.count) {
        prominentType = { type, avgAmount, count: typeStats[type].count };
      }
    }

    setStats({ avgMonthlyExpense, prominentType, totalExpenses: expensesData.length, currentMonthExpense, totalAmount });
  };

  useEffect(() => { loadExpenses(); }, []);

  const filteredAndPaginatedExpenses = useMemo(() => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.reported_by?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.amount?.toString().includes(searchTerm)
      );
    }

    if (filters.type) filtered = filtered.filter(e => e.type === filters.type);
    if (filters.reportedBy) filtered = filtered.filter(e => e.reported_by?.name === filters.reportedBy);
    if (filters.date) filtered = filtered.filter(e => {
      const expDate = new Date(e.created_at).toISOString().split("T")[0];
      return expDate === filters.date;
    });
    if (filters.amount) filtered = filtered.filter(e => parseFloat(e.amount) === parseFloat(filters.amount));

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { filtered, paginated };
  }, [expenses, searchTerm, filters, currentPage]);

  const totalPages = Math.ceil(filteredAndPaginatedExpenses.filtered.length / itemsPerPage);

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); setCurrentPage(1); };
  const handlePageChange = (page) => setCurrentPage(page);
  const handleViewProof = (row) => { const e = expenses.find(ex => ex.id === row[0]); if (e) { setSelectedExpense(e); setProofModalOpen(true); } };
  const handleViewDetails = (row) => { const e = expenses.find(ex => ex.id === row[0]); if (e) { setSelectedExpense(e); setDetailsModalOpen(true); } };

  const getProofUrl = async (path) => {
    if (!path) return null;
    try {
      if (path.startsWith("https://")) return path;
      const { data, error } = await supabase.storage.from('proof').createSignedUrl(path, 60);
      if (error) throw error;
      return data.signedUrl;
    } catch (err) { console.error("Error getting proof URL:", err); return path; }
  };

  useEffect(() => {
    if (selectedExpense && selectedExpense.proof_url && proofModalOpen) {
      const load = async () => { const url = await getProofUrl(selectedExpense.proof_url); setProofImageUrl(url); };
      load();
    }
  }, [selectedExpense, proofModalOpen]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      pages.push(<input key={i} type="radio" name="options" className="join-item btn btn-square" checked={currentPage === i} onChange={() => handlePageChange(i)} />);
    }

    return (
      <div className="join">
        {currentPage > 1 && <button className="join-item btn btn-square" onClick={() => handlePageChange(currentPage - 1)}>«</button>}
        {pages}
        {currentPage < totalPages && <button className="join-item btn btn-square" onClick={() => handlePageChange(currentPage + 1)}>»</button>}
      </div>
    );
  };

  return (
    <div className="min-h-[80vh] bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-base-content mb-4 sm:mb-0">Expenses</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-base-200 rounded-lg p-4 shadow-sm">
            <div className="stat-figure text-info"><FaChartBar className="w-8 h-8" /></div>
            <div className="stat-title">Total Expenses</div>
            <div className="stat-value text-secondary">{stats.totalExpenses}</div>
            <div className="stat-desc">All time</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4 shadow-sm">
            <div className="stat-figure text-info"><FaMoneyBill className="w-8 h-8" /></div>
            <div className="stat-title">Avg Monthly</div>
            <div className="stat-value text-secondary">₱{stats.avgMonthlyExpense.toFixed(2)}</div>
            <div className="stat-desc">Average per month</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4 shadow-sm">
            <div className="stat-figure text-info"><FaTag className="w-8 h-8" /></div>
            <div className="stat-title">Most Common</div>
            <div className="stat-value text-secondary text-lg">{stats.prominentType.type || 'N/A'}</div>
            <div className="stat-desc">₱{stats.prominentType.avgAmount?.toFixed(2) || '0'} avg</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4 shadow-sm">
            <div className="stat-figure text-info"><FaCalendarAlt className="w-8 h-8" /></div>
            <div className="stat-title">This Month</div>
            <div className="stat-value text-secondary">₱{stats.currentMonthExpense.toFixed(2)}</div>
            <div className="stat-desc">Current month expenses</div>
          </div>
        </div>

        <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" name="type" placeholder="Filter by type" value={filters.type} onChange={handleFilterChange} className="input input-bordered w-full" />
          <input type="text" name="reportedBy" placeholder="Filter by reporter" value={filters.reportedBy} onChange={handleFilterChange} className="input input-bordered w-full" />
          <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="input input-bordered w-full" />
          <input type="number" name="amount" placeholder="Filter by amount" value={filters.amount} onChange={handleFilterChange} className="input input-bordered w-full" />
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
          ) : filteredAndPaginatedExpenses.filtered.length === 0 ? (
            <div className="text-center py-12">
              <FaMoneyBill className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 font-medium mb-2">
                {searchTerm ? "No expenses match your search or filters" : "No expenses found"}
              </p>
              {(searchTerm || filters.type || filters.reportedBy || filters.date || filters.amount) && (
                <button className="btn btn-outline btn-sm" onClick={() => { setSearchTerm(""); setFilters({ type: "", reportedBy: "", date: "", amount: "" }); }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <DataTable
                columns={["ID", "Type", "Amount", "Reported By", "Date"]}
                data={filteredAndPaginatedExpenses.paginated.map(e => [
                  e.id,
                  e.type,
                  `₱${parseFloat(e.amount).toFixed(2)}`,
                  e.reported_by?.name || "Unknown",
                  new Date(e.created_at).toLocaleDateString(),
                ])}
                actions={[{
                  label: "Details",
                  className: "btn btn-sm btn-primary",
                  onClick: handleViewDetails,
                  icon: <FaReceipt className="w-4 h-4 mr-1" />
                }]}
              />
              {totalPages > 1 && <div className="flex justify-center mt-8">{renderPagination()}</div>}
            </>
          )}
        </div>

        <Modal
          isOpen={proofModalOpen}
          onClose={() => { setProofModalOpen(false); setProofImageUrl(null); }}
          title={selectedExpense ? `Proof: ${selectedExpense.type}` : "Expense Proof"}
          size="lg"
          footer={
            <div className="flex gap-3 justify-end">
              {selectedExpense?.proof_url && (
                <a href={proofImageUrl || selectedExpense.proof_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  <FaDownload className="w-4 h-4 mr-2" />Download Proof
                </a>
              )}
              <button className="btn btn-primary" onClick={() => setProofModalOpen(false)}>Close</button>
            </div>
          }
        >
          {selectedExpense && selectedExpense.proof_url ? (
            <div className="flex justify-center">
              {proofImageUrl ? (
                <img src={proofImageUrl} alt="Expense proof" className="max-w-full max-h-96 object-contain rounded-lg" />
              ) : (
                <div className="flex justify-center items-center h-64">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaExclamationTriangle className="w-12 h-12 mx-auto text-warning mb-4" />
              <p className="text-lg">No proof available for this expense</p>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={selectedExpense ? `Expense: ${selectedExpense.type}` : "Expense Details"}
          size="lg"
          footer={<div className="flex gap-3 justify-end"><button className="btn btn-outline" onClick={() => setDetailsModalOpen(false)}>Close</button></div>}
        >
          {selectedExpense && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-3 text-primary">Expense Information</h3>
                  <div className="space-y-3">
                    <div><label className="font-semibold">ID:</label><p className="mt-1 font-mono">{selectedExpense.id}</p></div>
                    <div><label className="font-semibold">Type:</label><p className="mt-1">{selectedExpense.type}</p></div>
                    <div><label className="font-semibold">Amount:</label><p className="mt-1 text-xl font-bold text-primary">₱{parseFloat(selectedExpense.amount).toFixed(2)}</p></div>
                    <div><label className="font-semibold">Date:</label><p className="mt-1">{new Date(selectedExpense.created_at).toLocaleString()}</p></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3 text-primary">Details</h3>
                  <div className="space-y-3">
                    <div><label className="font-semibold">Reason:</label><p className="mt-1 bg-base-200 p-3 rounded-lg">{selectedExpense.reason || "No reason provided"}</p></div>
                    <div><label className="font-semibold">Reported By:</label><p className="mt-1">{selectedExpense.reported_by?.name || "Unknown"}</p></div>
                    {selectedExpense.proof_url && (
                      <div>
                        <label className="font-semibold">Proof Available:</label>
                        <div className="mt-2">
                          <button className="btn btn-sm btn-info" onClick={() => { setDetailsModalOpen(false); setProofModalOpen(true); }}>
                            <FaEye className="w-4 h-4 mr-2" />View Proof
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
