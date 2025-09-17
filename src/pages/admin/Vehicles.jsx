import { useEffect, useState, useMemo } from "react";
import DataTable from "../../components/DataTable";
import { supabase } from "../../api/supabaseClient";
import Modal from "../../components/Modal";
import { FaPlus, FaCar, FaExclamationTriangle, FaEdit, FaTrash } from "react-icons/fa";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, plate_number, make, model, year, status, odometer, notes")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error("Failed to load vehicles:", err.message);
      setError("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVehicles(); }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch =
        v.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.make?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.model?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesYear = !yearFilter || v.year?.toString() === yearFilter.toString();
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [vehicles, searchTerm, yearFilter, statusFilter]);

  const handleAdd = () => { setEditingVehicle(null); setFormValues({}); setModalOpen(true); };
  const handleEdit = (row) => {
    const vehicle = vehicles.find(v => v.plate_number === row[0]);
    if (vehicle) { setEditingVehicle(vehicle); setFormValues(vehicle); setModalOpen(true); }
  };
  const handleDelete = async (row) => {
    const vehicle = vehicles.find(v => v.plate_number === row[0]);
    if (!vehicle) return;
    if (!confirm(`Are you sure you want to delete vehicle ${vehicle.plate_number}? This action cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", vehicle.id);
      if (error) throw error;
      setVehicles(prev => prev.filter(v => v.id !== vehicle.id));
    } catch (err) {
      console.error("Delete failed:", err.message);
      alert("Failed to delete vehicle.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingVehicle) {
        const { error } = await supabase.from("vehicles").update(formValues).eq("id", editingVehicle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicles").insert([formValues]);
        if (error) throw error;
      }
      setModalOpen(false);
      loadVehicles();
    } catch (err) {
      console.error("Save failed:", err.message);
      alert("Failed to save vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormValues(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  return (
    <div className="min-h-[80vh] bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-base-content mb-4 sm:mb-0">Vehicle Fleet</h1>
          <button className="btn btn-primary btn-lg shadow-md hover:shadow-lg transition-shadow" onClick={handleAdd}>
            <FaPlus className="w-5 h-5 mr-2" /> Add Vehicle
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:gap-4 mb-4 bg-base-200 p-4 rounded-lg">
          <div className="form-control w-full md:w-1/3">
            <label className="label"><span className="label-text font-semibold">Search</span></label>
            <div className="input-group">
              <input
                type="text"
                placeholder="Plate, Make, Model..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input input-bordered w-full focus:input-primary"
              />
            </div>
          </div>

          <div className="form-control w-full md:w-1/6">
            <label className="label"><span className="label-text font-semibold">Year</span></label>
            <input
              type="number"
              placeholder="e.g., 2023"
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="input input-bordered w-full focus:input-primary"
            />
          </div>

          <div className="form-control w-full md:w-1/6">
            <label className="label"><span className="label-text font-semibold">Status</span></label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="select select-bordered w-full focus:select-primary"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
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
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <FaCar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 font-medium mb-4">No vehicles found</p>
              <button className="btn btn-primary" onClick={handleAdd}>Add Your First Vehicle</button>
            </div>
          ) : (
            <DataTable
              columns={["Plate Number", "Make", "Model", "Year", "Status", "Odometer"]}
              data={filteredVehicles.map(v => [
                v.plate_number,
                v.make,
                v.model,
                v.year,
                <span className={`badge ${v.status === "active" ? "badge-success" : v.status === "maintenance" ? "badge-warning" : "badge-error"}`}>{v.status}</span>,
                v.odometer ? `${v.odometer.toLocaleString()} km` : "N/A"
              ])}
              actions={[
                { label: "Edit", className: "btn btn-sm btn-warning", onClick: handleEdit, icon: <FaEdit className="w-4 h-4 mr-1" /> },
                { label: "Delete", className: "btn btn-sm btn-error", onClick: handleDelete, icon: <FaTrash className="w-4 h-4 mr-1" /> },
              ]}
            />
          )}
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
          footer={
            <div className="flex gap-3 justify-end">
              <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <> <span className="loading loading-spinner loading-sm"></span> Saving... </> : (editingVehicle ? "Update Vehicle" : "Add Vehicle")}
              </button>
            </div>
          }
        >
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Plate Number *</span></label>
                <input type="text" name="plate_number" placeholder="ABC-123" value={formValues.plate_number || ""} onChange={handleChange} className="input input-bordered w-full focus:input-primary" required />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Status *</span></label>
                <select name="status" value={formValues.status || ""} onChange={handleChange} className="select select-bordered w-full focus:select-primary" required>
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Make</span></label>
                <input type="text" name="make" placeholder="Toyota" value={formValues.make || ""} onChange={handleChange} className="input input-bordered w-full focus:input-primary" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Model</span></label>
                <input type="text" name="model" placeholder="Camry" value={formValues.model || ""} onChange={handleChange} className="input input-bordered w-full focus:input-primary" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Year</span></label>
                <input type="number" name="year" placeholder="2023" min="1900" max="2100" value={formValues.year || ""} onChange={handleChange} className="input input-bordered w-full focus:input-primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Odometer (km)</span></label>
                <input type="number" name="odometer" placeholder="15000" min="0" value={formValues.odometer || ""} onChange={handleChange} className="input input-bordered w-full focus:input-primary" />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Notes</span></label>
              <textarea name="notes" placeholder="Additional notes about the vehicle..." value={formValues.notes || ""} onChange={handleChange} className="textarea textarea-bordered w-full focus:textarea-primary" rows={3} />
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
