import { useState, useEffect, useRef } from "react";
import { FaTrash } from "react-icons/fa";

export default function Destinations({ destinations, addStop, setDestinations }) {

  const handleAddFromSearch = (place) => {
    addStop(place.display_name, parseFloat(place.lat), parseFloat(place.lon));
    setSearch("");
    setSearchResults([]);
  };

  const handleRemove = (id) => {
    setDestinations(destinations.filter((d) => d.id !== id));
  };

  return (
    <div className="card p-2 bg-base-100">
      <h2 className="font-bold mb-2">Destinations</h2>

      <ul className="list-disc ml-4 gap-4 space-y-2 max-h-48 overflow-y-auto">
        {destinations.map((d, i) => (
          <li
            key={d.id}
            className="flex justify-between items-center bg-base-200/50 p-1 rounded"
          >
            <span>
              <span className="font-semibold">
                {i === 0 ? "Start: " : i === destinations.length - 1 ? "End: " : `Stop ${i}: `}
              </span>
              {d.name}
              <br />
              <strong>
                ({d.lat.toFixed(4)}, {d.lng.toFixed(4)})
              </strong>
            </span>
            <button
              className="btn btn-ghost btn-xs text-error"
              onClick={() => handleRemove(d.id)}
            >
              <FaTrash />
            </button>
          </li>
        ))}
      </ul>

      <p className="text-xs mt-1 text-gray-500">
        You can search or click on the map to add destinations.  
        Drag the blue line handles to adjust the route (without adding stops).
      </p>
    </div>
  );
}
