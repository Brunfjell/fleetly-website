import { useEffect, useState, useMemo } from "react";
import { getMyExpenses, uploadProof, updateExpenseProof, deleteProof } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatters";
import Modal from "../../components/Modal";
import { FaSearch, FaExclamationTriangle, FaMoneyBill, FaDownload, FaUpload, FaTrash, FaEye } from "react-icons/fa";

export default function MyExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const itemsPerPage = 6;

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = () => {
    setLoading(true);
    setError(null);
    getMyExpenses(user.id)
      .then((data) => setExpenses(data))
      .catch(() => setError("Failed to load your expenses"))
      .finally(() => setLoading(false));
  };

  const filteredAndPaginatedExpenses = useMemo(() => {
    const filtered = expenses.filter((expense) =>
      expense.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatCurrency(expense.amount)?.includes(searchTerm) ||
      expense.amount?.toString().includes(searchTerm)
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { filtered, paginated };
  }, [expenses, searchTerm, currentPage]);

  const totalPages = Math.ceil(filteredAndPaginatedExpenses.filtered.length / itemsPerPage);
  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const clearSearch = () => setSearchTerm("");
  const handlePageChange = (page) => setCurrentPage(page);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert("Please select an image (JPEG, PNG, GIF) or PDF file");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !selectedExpense) return;
    
    setUploading(true);
    try {
      const { data: uploadData, error: uploadError } = await uploadProof(
        selectedExpense.id, 
        selectedFile
      );
      
      if (uploadError) throw uploadError;
      
      const { error: updateError } = await updateExpenseProof(
        selectedExpense.id, 
        uploadData.path
      );
      
      if (updateError) throw updateError;
      
      loadExpenses();
      setUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedExpense(null);
      
    } catch (err) {
      console.error("Failed to upload proof:", err);
      alert("Failed to upload proof. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProof = async () => {
    if (!selectedExpense || !selectedExpense.proof_url) return;
    
    setDeleting(true);
    try {
      const { error: deleteError } = await deleteProof(selectedExpense.proof_url);
      if (deleteError) throw deleteError;
      
      const { error: updateError } = await updateExpenseProof(selectedExpense.id, null);
      if (updateError) throw updateError;
      
      loadExpenses();
      setViewModalOpen(false);
      setSelectedExpense(null);
      
    } catch (err) {
      console.error("Failed to delete proof:", err);
      alert("Failed to delete proof. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const openUploadModal = (expense) => {
    setSelectedExpense(expense);
    setSelectedFile(null);
    setUploadModalOpen(true);
  };

  const openViewModal = (expense) => {
    setSelectedExpense(expense);
    setViewModalOpen(true);
  };

  const isImageFile = (url) => {
    if (!url) return false;
    const extension = url.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  };

  const isPdfFile = (url) => {
    if (!url) return false;
    const extension = url.split('.').pop().toLowerCase();
    return extension === 'pdf';
  };

  return (
    <div className="min-h-[80vh] bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold text-base-content mb-4">My Expenses</h1>

        <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Search My Expenses</span>
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, type, reason, or amount..."
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
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
              <span className="loading loading-infinity loading-xl"></span>
              <p className="text-gray-600">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <FaMoneyBill className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 font-medium mb-4">No expenses found</p>
              <p className="text-base-content opacity-70">You haven't submitted any expenses yet.</p>
            </div>
          ) : filteredAndPaginatedExpenses.filtered.length === 0 ? (
            <div className="text-center py-12">
              <FaMoneyBill className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 font-medium mb-4">No expenses match your search</p>
              <button className="btn btn-outline" onClick={clearSearch}>Clear Search</button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Proof</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndPaginatedExpenses.paginated.map((expense) => (
                      <tr key={expense.id}>
                        <td className="font-mono">{expense.id.slice(0, 8)}...</td>
                        <td>{expense.type}</td>
                        <td>{formatCurrency(expense.amount)}</td>
                        <td>{expense.reason || "No reason provided"}</td>
                        <td>
                          {expense.proof_url ? (
                            <button 
                              className="btn btn-sm btn-outline flex items-center"
                              onClick={() => openViewModal(expense)}
                            >
                              <FaEye className="w-4 h-4 mr-2" /> View
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {!expense.proof_url ? (
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => openUploadModal(expense)}
                            >
                              <FaUpload className="w-4 h-4 mr-1" /> Upload
                            </button>
                          ) : (
                            <button 
                              className="btn btn-sm btn-outline btn-error"
                              onClick={() => openViewModal(expense)}
                            >
                              <FaTrash className="w-4 h-4 mr-1" /> Replace
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      className={`btn btn-square ${currentPage === i + 1 ? "btn-active" : ""}`} 
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <Modal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title="Upload Proof Document"
          size="md"
        >
          {selectedExpense && (
            <div className="space-y-4">
              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Expense Details</h3>
                <p><span className="font-medium">Type:</span> {selectedExpense.type}</p>
                <p><span className="font-medium">Amount:</span> {formatCurrency(selectedExpense.amount)}</p>
                <p><span className="font-medium">Reason:</span> {selectedExpense.reason || "No reason provided"}</p>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Select Proof Document</span>
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.pdf"
                  onChange={handleFileSelect}
                  className="file-input file-input-bordered w-full"
                />
                <label className="label">
                  <span className="label-text-alt">
                    Accepted formats: JPG, PNG, GIF, PDF (Max 5MB)
                  </span>
                </label>
              </div>
              
              {selectedFile && (
                <div className="bg-base-200 p-3 rounded-lg">
                  <p className="font-medium">Selected file:</p>
                  <p>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  className="btn btn-outline" 
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleUploadProof}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload className="w-4 h-4 mr-2" />
                      Upload Proof
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title="Expense Proof"
          size="max-w-4xl"
        >
          {selectedExpense && selectedExpense.proof_url && (
            <div className="space-y-6">
              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Expense Details</h3>
                <p><span className="font-medium">Type:</span> {selectedExpense.type}</p>
                <p><span className="font-medium">Amount:</span> {formatCurrency(selectedExpense.amount)}</p>
                <p><span className="font-medium">Reason:</span> {selectedExpense.reason || "No reason provided"}</p>
              </div>
              
              <div className="flex justify-center">
                {isImageFile(selectedExpense.proof_url) ? (
                  <img 
                    src={selectedExpense.proof_url} 
                    alt="Expense proof" 
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
                  />
                ) : isPdfFile(selectedExpense.proof_url) ? (
                  <div className="bg-base-200 p-8 rounded-lg text-center">
                    <FaDownload className="w-16 h-16 mx-auto text-primary mb-4" />
                    <p className="font-medium mb-4">PDF Document</p>
                    <a 
                      href={selectedExpense.proof_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <FaDownload className="w-4 h-4 mr-2" />
                      Download PDF
                    </a>
                  </div>
                ) : (
                  <div className="bg-base-200 p-8 rounded-lg text-center">
                    <FaDownload className="w-16 h-16 mx-auto text-primary mb-4" />
                    <p className="font-medium mb-4">Proof Document</p>
                    <a 
                      href={selectedExpense.proof_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <FaDownload className="w-4 h-4 mr-2" />
                      Download File
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between gap-4 pt-4 border-t border-base-300">
                <div>
                  <button 
                    className="btn btn-error"
                    onClick={handleDeleteProof}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FaTrash className="w-4 h-4 mr-2" />
                        Delete Proof
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <a 
                    href={selectedExpense.proof_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    <FaDownload className="w-4 h-4 mr-2" />
                    Download
                  </a>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setViewModalOpen(false);
                      openUploadModal(selectedExpense);
                    }}
                  >
                    <FaUpload className="w-4 h-4 mr-2" />
                    Replace Proof
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}