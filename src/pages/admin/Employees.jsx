import { useEffect, useState, useMemo } from "react";
import DataTable from "../../components/DataTable";
import { supabase } from "../../api/supabaseClient";
import Modal from "../../components/Modal";
import {
  FaPlus,
  FaExclamationTriangle,
  FaUser,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone, role")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error("Failed to load employees:", err.message);
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole =
        roleFilter === "all" || emp.role?.toLowerCase() === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [employees, searchTerm, roleFilter]);

  const handleAdd = () => {
    setSelectedEmployee(null);
    setForm({});
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    const emp = employees.find((e) => e.email === row[1]);
    if (emp) {
      setSelectedEmployee(emp);
      setForm(emp);
      setModalOpen(true);
    }
  };

  const handleDelete = async (row) => {
    const emp = employees.find((e) => e.email === row[1]);
    if (!emp) return;
    if (!confirm(`Are you sure you want to delete ${emp.name}?`)) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(emp.id);
      if (error) throw error;
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
    } catch (err) {
      console.error("Delete failed:", err.message);
      alert("Failed to delete employee.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedEmployee) {
        const { error } = await supabase
          .from("profiles")
          .update({
            name: form.name,
            phone: form.phone,
            role: form.role,
          })
          .eq("id", selectedEmployee.id);
        if (error) throw error;
      } else {
        const { error: createError } = await supabase.auth.admin.createUser({
          email: form.email,
          password: "changeme123",
          email_confirm: true,
          user_metadata: {
            name: form.name,
            phone: form.phone,
            role: form.role,
          },
        });
        if (createError) throw createError;
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-[92vh] bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-base-content mb-4 sm:mb-0">
            Employee Management
          </h1>
          <button
            className="btn bg-green-500 hover:bg-green-600 text-white btn-lg shadow-md"
            onClick={handleAdd}
          >
            <FaPlus className="w-5 h-5 mr-2" /> Add Employee
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between bg-base-100 p-4 sm:p-6 rounded-md shadow-sm mb-6">
          <div className="form-control w-full md:w-1/3">
            <label className="label">
              <span className="label-text font-semibold">Search</span>
            </label>
            <input
              type="text"
              placeholder="Name, Email, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full focus:input-primary"
            />
          </div>

          <div className="form-control">
            <label className="label justify-start">
              <span className="label-text font-semibold">Role</span>
            </label>
            <select
              name="role"
              value={form.role || ""}
              onChange={handleChange}
              className="select select-bordered w-full focus:select-primary"
              required
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
              <option value="driver">Driver</option>
            </select>
          </div>
        </div>

        <div className="bg-base-100 rounded-md shadow-sm p-6">
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
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <FaUser className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 font-medium mb-4">
                No employees found
              </p>
              <button
                className="btn bg-green-500 hover:bg-green-600 text-white"
                onClick={handleAdd}
              >
                <FaPlus className="w-4 h-4 mr-2" /> Add Your First Employee
              </button>
            </div>
          ) : (
            <DataTable
              columns={["Name", "Email", "Phone", "Role"]}
              data={filteredEmployees.map((e) => [
                e.name || "-",
                e.email || "-",
                e.phone || "-",
                <span
                  className={`badge ${
                    e.role === "admin"
                      ? "badge-primary"
                      : e.role === "driver"
                      ? "badge-info"
                      : "badge-ghost"
                  }`}
                >
                  {e.role}
                </span>,
              ])}
              actions={[
                {
                  label: "Edit",
                  className: "btn btn-sm bg-blue-500 hover:bg-blue-600 text-white",
                  onClick: handleEdit,
                  icon: <FaEdit className="w-4 h-4 mr-1" />,
                },
                {
                  label: "Delete",
                  className: "btn btn-sm bg-red-500 hover:bg-red-600 text-white",
                  onClick: handleDelete,
                  icon: <FaTrash className="w-4 h-4 mr-1" />,
                },
              ]}
            />
          )}
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selectedEmployee ? "Edit Employee" : "Add Employee"}
          footer={
            <div className="flex justify-end gap-3">
              <button
                className="btn btn-outline border-base-300 text-base-content"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`btn ${
                  selectedEmployee
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-green-500 hover:bg-green-600"
                } text-white`}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : selectedEmployee ? (
                  "Update"
                ) : (
                  "Add Employee"
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Full Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name || ""}
                onChange={handleChange}
                placeholder="John Doe"
                className="input input-bordered w-full focus:input-primary"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email || ""}
                onChange={handleChange}
                placeholder="example@email.com"
                className="input input-bordered w-full focus:input-primary"
                required={!selectedEmployee}
                disabled={!!selectedEmployee}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Phone</span>
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
                placeholder="09XXXXXXXXX"
                className="input input-bordered w-full focus:input-primary"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Role</span>
              </label>
              <select
                name="role"
                value={form.role || ""}
                onChange={handleChange}
                className="select select-bordered w-full focus:select-primary"
                required
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="driver">Driver</option>
              </select>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
