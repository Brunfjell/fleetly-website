import { useEffect, useState } from "react";
import { getMyTrips, cancelTrip } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import TripCardN from "../../components/TripCardN";
import ActiveTrip from "./ActiveTrip";

export default function TripInterface() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTrips();
    }
  }, [user]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const allTrips = await getMyTrips(user.id);

      const assigned = allTrips.filter(
        (t) => t.status === "approved" || t.status === "in_progress"
      );

      setTrips(assigned);
    } catch (err) {
      console.error("Failed to load trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (tripId) => {
    if (!confirm("Cancel this trip?")) return;
    const { error } = await cancelTrip(tripId);
    if (error) {
      alert("Failed to cancel trip.");
      return;
    }
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
  };

  if (activeTrip) {
    return (
      <ActiveTrip
        tripId={activeTrip.id}
        initialTrip={activeTrip}
        onBack={() => {
          setActiveTrip(null);
          loadTrips();
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="min-h-[80vh] bg-base-200 p-6 space-y-6 rounded-lg">
        <h1 className="text-3xl font-bold text-center md:text-left">
          My Assigned Trips
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : trips.length === 0 ? (
          <div className="alert alert-info shadow">
            <span>No trips assigned yet.</span>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => {
              const startLabel =
                trip.status === "approved"
                  ? "Start"
                  : trip.status === "in_progress"
                  ? "Continue"
                  : "";

              return (
                <TripCardN
                  key={trip.id}
                  trip={trip}
                  startLabel={startLabel}
                  onStart={() => setActiveTrip(trip)}
                  onCancel={() => handleCancel(trip.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
