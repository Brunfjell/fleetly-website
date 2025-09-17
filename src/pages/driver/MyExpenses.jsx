import { useEffect, useState, useMemo } from "react";
import { getMyExpenses, uploadProof, updateExpenseProof, deleteProof } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal";
import { formatCurrency } from "../../utils/formatters";
import { FaSearch, FaExclamationTriangle, FaMoneyBill, FaDownload, FaUpload, FaTrash, FaEye } from "react-icons/fa";

export default function MyExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [amountOrder, setAmountOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadExpenses();
  }, [user]);

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyExpenses(user.id);
      setExpenses(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load your expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const clearFilters = () => {
    setSearchTerm(""); setTypeFilter("all"); setStartDate(""); setEndDate(""); setAmountOrder("asc"); setCurrentPage(1);
  };
  const handlePageChange = (page) => setCurrentPage(page);
  const openUploadModal = (exp) => { setSelectedExpense(exp); setSelectedFile(null); setUploadModalOpen(true); };
  const openViewModal = (exp) => { setSelectedExpense(exp); setViewModalOpen(true); };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File must be < 5MB"); return; }
    const validTypes = ["image/jpeg","image/png","image/gif","application/pdf"];
    if (!validTypes.includes(file.type)) { alert("Invalid file type"); return; }
    setSelectedFile(file);
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !selectedExpense) return;
    setUploading(true);
    try {
      const { data, error } = await uploadProof(selectedExpense.id, selectedFile);
      if (error) throw error;
      const { error: updateError } = await updateExpenseProof(selectedExpense.id, data.path);
      if (updateError) throw updateError;
      loadExpenses();
      setUploadModalOpen(false);
      setSelectedExpense(null);
      setSelectedFile(null);
    } catch (err) { console.error(err); alert("Failed to upload proof"); }
    finally { setUploading(false); }
  };

  const handleDeleteProof = async () => {
    if (!selectedExpense || !selectedExpense.proof_url) return;
    setDeleting(true);
    try {
      const { error: delErr } = await deleteProof(selectedExpense.proof_url);
      if (delErr) throw delErr;
      const { error: updateErr } = await updateExpenseProof(selectedExpense.id, null);
      if (updateErr) throw updateErr;
      loadExpenses();
      setViewModalOpen(false);
      setSelectedExpense(null);
    } catch (err) { console.error(err); alert("Failed to delete proof"); }
    finally { setDeleting(false); }
  };

  const isImageFile = url => url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdfFile = url => url?.match(/\.pdf$/i);

  const filteredAndPaginatedExpenses = useMemo(() => {
    let filtered = expenses.filter(e => {
      const matchesSearch =
        e.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatCurrency(e.amount)?.includes(searchTerm) ||
        e.amount?.toString().includes(searchTerm);

      const matchesType = typeFilter === "all" || e.type === typeFilter;

      const expDate = e.date ? new Date(e.date) : null;
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDate = (!start || (expDate && expDate >= start)) && (!end || (expDate && expDate <= end));

      return matchesSearch && matchesType && matchesDate;
    });

    filtered.sort((a, b) => amountOrder === "asc" ? a.amount - b.amount : b.amount - a.amount);

    const startIdx = (currentPage - 1) * itemsPerPage;
    return { filtered, paginated: filtered.slice(startIdx, startIdx + itemsPerPage) };
  }, [expenses, searchTerm, typeFilter, startDate, endDate, amountOrder, currentPage]);

  const totalPages = Math.ceil(filteredAndPaginatedExpenses.filtered.length / itemsPerPage);
  const expenseTypes = Array.from(new Set(expenses.map(e => e.type))).sort();

  return (
    <div className="min-h-[80vh] bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold mb-4">My Expenses</h1>

        {/* Filters */}
        <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Search</span></label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3.5 w-4 h-4 text-gray-400"/>
              <input type="text" placeholder="Search..." value={searchTerm} onChange={handleSearch} className="input input-bordered w-full pl- focus:input-primary"/>
            </div>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Type</span></label>
            <select className="select select-bordered" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All</option>
              {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Start Date</span></label>
            <input type="date" className="input input-bordered" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}/>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">End Date</span></label>
            <input type="date" className="input input-bordered" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}/>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Amount</span></label>
            <select className="select select-bordered" value={amountOrder} onChange={e => { setAmountOrder(e.target.value); setCurrentPage(1); }}>
              <option value="asc">Low → High</option>
              <option value="desc">High → Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6">
          {error && <div className="alert alert-error mb-4"><FaExclamationTriangle className="w-5 h-5 mr-2"/> {error}</div>}

          {loading ? (
            <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : filteredAndPaginatedExpenses.filtered.length === 0 ? (
            <div className="text-center py-12">
              <FaMoneyBill className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
              <p>No expenses match your filters</p>
              <button className="btn btn-outline mt-4" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>ID</th><th>Type</th><th>Amount</th><th>Reason</th><th>Proof</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndPaginatedExpenses.paginated.map(exp => (
                      <tr key={exp.id}>
                        <td className="font-mono">{exp.id.slice(0,8)}...</td>
                        <td>{exp.type}</td>
                        <td>{formatCurrency(exp.amount)}</td>
                        <td>{exp.reason || "-"}</td>
                        <td>
                          {exp.proof_url ? (
                            <button className="btn btn-sm btn-outline flex items-center" onClick={() => openViewModal(exp)}>
                              <FaEye className="w-4 h-4 mr-2"/>View
                            </button>
                          ) : "—"}
                        </td>
                        <td>
                          {!exp.proof_url ? (
                            <button className="btn btn-sm btn-primary" onClick={() => openUploadModal(exp)}>
                              <FaUpload className="w-4 h-4 mr-1"/>Upload
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-outline btn-error" onClick={() => openViewModal(exp)}>
                              <FaTrash className="w-4 h-4 mr-1"/>Replace
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} className={`btn btn-square ${currentPage === i+1 ? "btn-active" : ""}`} onClick={() => handlePageChange(i+1)}>{i+1}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Proof Document" size="md">
          {selectedExpense && (
            <div className="space-y-4">
              <div className="bg-base-200 p-4 rounded-lg">
                <p><strong>Type:</strong> {selectedExpense.type}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedExpense.amount)}</p>
                <p><strong>Reason:</strong> {selectedExpense.reason || "-"}</p>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,.gif,.pdf" onChange={handleFileSelect} className="file-input file-input-bordered w-full"/>
              {selectedFile && <p>Selected: {selectedFile.name} ({(selectedFile.size/1024).toFixed(2)} KB)</p>}
              <div className="flex justify-end gap-3 mt-4">
                <button className="btn btn-outline" onClick={() => setUploadModalOpen(false)} disabled={uploading}>Cancel</button>
                <button className="btn btn-primary" onClick={handleUploadProof} disabled={!selectedFile || uploading}>{uploading ? <span className="loading loading-spinner loading-sm"></span> : "Upload Proof"}</button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Expense Proof" size="max-w-4xl">
          {selectedExpense?.proof_url && (
            <div className="space-y-6">
              <div className="bg-base-200 p-4 rounded-lg">
                <p><strong>Type:</strong> {selectedExpense.type}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedExpense.amount)}</p>
                <p><strong>Reason:</strong> {selectedExpense.reason || "-"}</p>
              </div>
              <div className="flex justify-center">
                {isImageFile(selectedExpense.proof_url) ? (
                  <img src={selectedExpense.proof_url} alt="Proof" className="max-w-full max-h-96 object-contain rounded-lg"/>
                ) : (
                  <a href={selectedExpense.proof_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex items-center">
                    <FaDownload className="w-4 h-4 mr-2"/>Download File
                  </a>
                )}
              </div>
              <div className="flex justify-between mt-4">
                <button className="btn btn-error" onClick={handleDeleteProof} disabled={deleting}>{deleting ? "Deleting..." : "Delete Proof"}</button>
                <button className="btn btn-primary" onClick={() => { setViewModalOpen(false); openUploadModal(selectedExpense); }}>
                  <FaUpload className="w-4 h-4 mr-2"/>Replace Proof
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
