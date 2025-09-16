import { useEffect, useState, useMemo } from "react";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { supabase } from "../../api/supabaseClient";
import { FaPlus, FaExclamationTriangle, FaUsers, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "employee" });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone, role")
        .in("role", ["employee", "driver"]);

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error("Error loading employees:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    
    return employees.filter(employee =>
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const openAddModal = () => {
    setSelectedEmployee(null);
    setForm({ name: "", email: "", phone: "", role: "employee" });
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    const emp = employees.find(
      (e) => e.name === row[0] && e.email === row[1]
    );
    if (!emp) return;
    setSelectedEmployee(emp);
    setForm({ name: emp.name, email: emp.email, phone: emp.phone || "", role: emp.role });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedEmployee) {
        const { error } = await supabase
          .from("profiles")
          .update(form)
          .eq("id", selectedEmployee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").insert([form]);
        if (error) throw error;
      }
      setModalOpen(false);
      loadEmployees();
    } catch (err) {
      console.error("Save failed:", err.message);
      alert("Failed to save employee.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const emp = employees.find(
      (e) => e.name === row[0] && e.email === row[1]
    );
    if (!emp) return;
    if (!confirm(`Are you sure you want to delete ${emp.name}?`)) return;

    try {
      const { error } = await supabase.from("profiles").delete().eq("id", emp.id);
      if (error) throw error;
      setEmployees(employees.filter((e) => e.id !== emp.id));
    } catch (err) {
      console.error("Delete failed:", err.message);
      alert("Failed to delete employee.");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

 return (
  <div className="min-h-[80vh] bg-base-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-base-content mb-4 sm:mb-0">
          Employees & Drivers
        </h1>
        <button 
          className="btn btn-primary btn-lg shadow-md hover:shadow-lg transition-shadow"
          onClick={openAddModal}
        >
          <FaPlus className="w-5 h-5 mr-2" />
          Add New
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Search Employees & Drivers</span>
          </label>
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or role..."
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
              Showing {filteredEmployees.length} of {employees.length} employees
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}
        </div>
      </div>

      <div className="bg-base-200 rounded-lg shadow-sm p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : error ? (
          <div className="alert alert-error shadow-lg">
            <FaExclamationTriangle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 font-medium mb-4">No employees or drivers found</p>
            <button className="btn btn-primary" onClick={openAddModal}>
              Add Your First Employee
            </button>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 font-medium mb-4">No employees match your search</p>
            <button className="btn btn-outline" onClick={clearSearch}>
              Clear Search
            </button>
          </div>
        ) : (
          <DataTable
            columns={["Name", "Email", "Phone", "Role"]}
            data={filteredEmployees.map((e) => [e.name, e.email, e.phone || "N/A", e.role])}
            actions={[
              { 
                label: "Edit", 
                className: "btn btn-sm btn-warning", 
                onClick: openEditModal,
                icon: <FaEdit className="w-4 h-4 mr-1" />
              },
              { 
                label: "Delete", 
                className: "btn btn-sm btn-error", 
                onClick: handleDelete,
                icon: <FaTrash className="w-4 h-4 mr-1" />
              },
            ]}
          />
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedEmployee ? "Edit Employee/Driver" : "Add Employee/Driver"}
        footer={
          <div className="flex gap-3 justify-end">
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full focus:input-primary"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Email</span>
            </label>
            <input
              type="email"
              className="input input-bordered w-full focus:input-primary"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email address"
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Phone</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full focus:input-primary"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Role</span>
            </label>
            <select
              className="select select-bordered w-full focus:select-primary"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="employee">Employee</option>
              <option value="driver">Driver</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  </div>
);
}