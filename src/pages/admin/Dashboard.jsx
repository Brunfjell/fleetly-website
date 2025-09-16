import { useEffect, useState } from "react";
import { getVehicles, getTrips, getExpenses } from "../../api/api";
import { FaCar, FaRoute, FaMoneyBill, FaUsers, FaClock, FaExclamationTriangle } from "react-icons/fa";

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    vehicles: 0, 
    trips: 0, 
    expenses: 0,
    activeTrips: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [vehicles, trips, expenses] = await Promise.all([
          getVehicles(),
          getTrips({ id: null }, "admin"),
          getExpenses({ id: null }, "admin")
        ]);

        const activeTrips = trips.data?.filter(trip => trip.status === 'in_progress')?.length || 0;

        setStats({
          vehicles: vehicles.data?.length || 0,
          trips: trips.data?.length || 0,
          expenses: expenses.data?.length || 0,
          activeTrips
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color = "primary", subtitle }) => (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-base-content">{value}</div>
            <div className="text-sm text-base-content opacity-70">{title}</div>
            {subtitle && <div className="text-xs text-base-content opacity-50 mt-1">{subtitle}</div>}
          </div>
          <div className={`text-4xl text-${color}`}>
            <Icon />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[91vh] bg-base-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content mb-2">Dashboard Overview</h1>
          <p className="text-base-content opacity-70">Welcome to your fleet management dashboard</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6 shadow-lg">
            <FaExclamationTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
              <p className="text-base-content opacity-70">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Vehicles"
                value={stats.vehicles}
                icon={FaCar}
                color="accent"
                subtitle="Fleet size"
              />
              <StatCard
                title="Total Trips"
                value={stats.trips}
                icon={FaRoute}
                color="accent"
                subtitle="All time"
              />
              <StatCard
                title="Active Trips"
                value={stats.activeTrips}
                icon={FaClock}
                color="accent"
                subtitle="In progress"
              />
              <StatCard
                title="Total Expenses"
                value={stats.expenses}
                icon={FaMoneyBill}
                color="accent"
                subtitle="All expenses"
              />
            </div>

            <div className="bg-base-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-base-content mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="btn btn-accent btn-outline">
                  <FaCar className="w-4 h-4 mr-2" />
                  Manage Vehicles
                </button>
                <button className="btn btn-accent btn-outline">
                  <FaRoute className="w-4 h-4 mr-2" />
                  View Trips
                </button>
                <button className="btn btn-accent btn-outline">
                  <FaMoneyBill className="w-4 h-4 mr-2" />
                  Review Expenses
                </button>
                <button className="btn btn-accent btn-outline">
                  <FaUsers className="w-4 h-4 mr-2" />
                  Manage Users
                </button>
              </div>
            </div>
          {/*}
            <div className="mt-8 bg-base-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-base-content mb-4">Recent Activity</h2>
              <div className="text-center py-8">
                <FaClock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-base-content opacity-70">Recent activity will appear here</p>
              </div>
            </div>
          */}
          </>
        )}
      </div>
    </div>
  );
}