export default function TripCardN({ trip, onStart, onCancel }) {
  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition">
      <div className="card-body">
        <h2 className="card-title text-lg">{trip.destination}</h2>
        <p className="text-sm text-gray-500">{trip.start_time}</p>
        <p>Vehicle: <span className="font-semibold">{trip.vehicle?.plate_number}</span></p>
        <p>Status: <span className={`badge ${trip.status === "approved" ? "badge-success" : "badge-ghost"}`}>{trip.status}</span></p>
        <div className="card-actions justify-end mt-3">
          {onStart && <button className="btn btn-sm btn-primary" onClick={onStart}>Start</button>}
          {onCancel && <button className="btn btn-sm btn-error" onClick={onCancel}>Cancel</button>}
        </div>
      </div>
    </div>
  );
}
