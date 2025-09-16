import { useState } from "react";
import { FaTrash } from "react-icons/fa";

export default function Destinations({ destinations, addStop, setDestinations }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    if (!search) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          search
        )}`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

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

      <div className="flex mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search location..."
          className="input input-sm flex-1 mr-2"
        />
        <button className="btn btn-xs" onClick={handleSearch}>
          Search
        </button>
      </div>

      {searchResults.length > 0 && (
        <ul className="border p-2 rounded mb-2 max-h-40 overflow-y-auto">
          {searchResults.map((place) => (
            <li
              key={place.place_id}
              className="cursor-pointer hover:bg-base-200 p-1 rounded"
              onClick={() => handleAddFromSearch(place)}
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}

      <ul className="list-disc ml-4">
        {destinations.map((d) => (
          <li key={d.id} className="flex justify-between items-center">
            <span>
              {d.name} ({d.lat.toFixed(4)}, {d.lng.toFixed(4)})
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
        Tip: You can also click directly on the map to add stops.
      </p>
    </div>
  );
}
