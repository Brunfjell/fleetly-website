import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { getTripById } from "../../api/api";

import MapView from "./activetrip/index"; 
import Destinations from "./activetrip/Destinations";
import Expenses from "./activetrip/Expenses";
import CompleteTrip from "./activetrip/CompleteTrip";

export default function ActiveTrip({ tripId, onBack }) {
  const [trip, setTrip] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return setLoading(false);
    let isMounted = true;

    const fetchTrip = async () => {
      setLoading(true);
      try {
        const { data, error } = await getTripById(tripId);
        if (error) throw error;
        if (!data) return;

        const normalizedTrip = {
          ...data,
          start_location:
            data.start_lat != null && data.start_lng != null
              ? { lat: data.start_lat, lng: data.start_lng }
              : null,
          end_location:
            data.end_lat != null && data.end_lng != null
              ? { lat: data.end_lat, lng: data.end_lng }
              : null,
        };

        if (!isMounted) return;

        setTrip(normalizedTrip);

        const initDestinations = [];

        if (normalizedTrip.start_location) {
          initDestinations.push({
            id: uuidv4(),
            name: "Starting Point",
            lat: normalizedTrip.start_location.lat,
            lng: normalizedTrip.start_location.lng,
          });
        }

        if (Array.isArray(normalizedTrip.route_points)) {
          normalizedTrip.route_points.forEach((p, i) => {
            if (p.lat != null && p.lng != null) {
              initDestinations.push({
                id: uuidv4(),
                name: p.name || `Stop ${i + 1}`,
                lat: p.lat,
                lng: p.lng,
              });
            }
          });
        }

        if (normalizedTrip.end_location) {
          initDestinations.push({
            id: uuidv4(),
            name: normalizedTrip.destination || "Destination",
            lat: normalizedTrip.end_location.lat,
            lng: normalizedTrip.end_location.lng,
          });
        }

        setDestinations(initDestinations);
        setExpenses(normalizedTrip.expenses || []);
      } catch (err) {
        console.error("Failed to fetch trip:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTrip();
    return () => {
      isMounted = false;
    };
  }, [tripId]);

  const addStop = (name, lat, lng) => {
    setDestinations([...destinations, { id: uuidv4(), name, lat, lng }]);
  };

  const addExpense = () => {
    setExpenses([...expenses, { id: uuidv4(), reason: "", amount: 0, proof: null }]);
  };

  const updateExpense = (id, field, value) => {
    setExpenses(expenses.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const removeExpense = id => setExpenses(expenses.filter(e => e.id !== id));

  if (loading) return <p className="text-center mt-10">Loading trip details...</p>;
  if (!trip) return <p className="text-center mt-10">Trip not found.</p>;

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="flex-1 h-80 md:h-full">
        <MapView destinations={destinations} setDestinations={setDestinations} />
      </div>

      <div className="w-full md:w-96 p-4 bg-base-200 overflow-y-auto space-y-4">
        <button className="btn btn-sm mb-2" onClick={onBack}>
          Back
        </button>

        <Destinations
          destinations={destinations}
          addStop={addStop}
          setDestinations={setDestinations}
        />

        <Expenses
          expenses={expenses}
          addExpense={addExpense}
          updateExpense={updateExpense}
          removeExpense={removeExpense}
        />

        <CompleteTrip tripId={trip.id} onBack={onBack} />
      </div>
    </div>
  );
}
