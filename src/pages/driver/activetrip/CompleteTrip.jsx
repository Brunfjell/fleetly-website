import { completeTrip } from "../../../api/api";

export default function CompleteTrip({ tripId, onBack }) {
  const handleComplete = async () => {
    if (!confirm("Are you sure you want to complete this trip?")) return;
    try {
      await completeTrip(tripId);
      alert("Trip completed!");
      onBack();
    } catch (err) {
      console.error(err);
      alert("Failed to complete trip.");
    }
  };

  return (
    <button className="btn btn-success w-full" onClick={handleComplete}>
      Complete Trip
    </button>
  );
}
