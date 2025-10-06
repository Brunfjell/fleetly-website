import { formatDate } from "../utils/formatters";

export default function TripCard({ trip, onView }) {
  return (
    <div className="card border border-gray-300/75 shadow-md hover:shadow-lg transition bg-base-100">
      <div className="card-body">
        <h2 className="card-title text-lg">
          {trip.reason || "Trip"}
        </h2>

        <p className="text-sm text-gray-500">
          Start: {trip.start_time ? formatDate(trip.start_time) : "-"} <br />
          End: {trip.end_time ? formatDate(trip.end_time) : "-"}
        </p>

        <p className="mt-2">
          Vehicle:{" "}
          <span className="font-semibold">
            {trip.vehicle?.plate_number || "-"} ({trip.vehicle?.make || "-"} {trip.vehicle?.model || "-"})
          </span>
        </p>

        <div className="mt-2">
          <label className="font-semibold text-sm">Status:</label>
          <div className="mt-1">
            <span
              className={`badge ${
                trip.status === "completed"
                  ? "badge-success"
                  : trip.status === "approved"
                  ? "badge-success"
                  : trip.status === "in_progress"
                  ? "badge-info"
                  : trip.status === "requested"
                  ? "badge-info"
                  : trip.status === "pending"
                  ? "badge-warning"
                  : trip.status === "cancelled"
                  ? "badge-error text-white"
                  : "badge-ghost"
              }`}
            >
              {trip.status || "-"}
            </span>
          </div>
        </div>

        <div className="card-actions justify-end mt-3">
          <button className="btn btn-sm btn-primary" onClick={onView}>
            View
          </button>
        </div>
      </div>
    </div>
  );
}
