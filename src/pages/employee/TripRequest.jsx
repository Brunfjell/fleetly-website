import { useState, useEffect, useMemo, useRef } from "react";
import TripMap from "./TripMap";
import Calendar from "../../components/Calendar";
import { getDrivers, getVehicles, addTrip, addTripRoutePoint } from "../../api/api";
import { MdFilterCenterFocus, MdDirectionsCar, MdPerson, MdDescription } from "react-icons/md";
import { FaRoute, FaPlus, FaSpinner, FaWindowClose } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";
import { RiPinDistanceFill } from "react-icons/ri";

const haversineDistance = (p1, p2) => {
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getLocationName = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://us1.locationiq.com/v1/reverse?key=${
        import.meta.env.VITE_LOCATIONIQ_API_KEY
      }&lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  } catch {
    return `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  }
};

export default function TripRequest() {
  const { currentUserId } = useOutletContext();

  const [center, setCenter] = useState([14.5995, 120.9842]);
  const [waypoints, setWaypoints] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [tripReason, setTripReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => console.warn("Could not get location")
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 750);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.length < 3) return setSearchResults([]);
    const fetchLocations = async () => {
      try {
        const res = await fetch(
          `https://us1.locationiq.com/v1/search?key=${
            import.meta.env.VITE_LOCATIONIQ_API_KEY
          }&q=${encodeURIComponent(debouncedSearch)}&format=json`
        );
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Location search failed:", err);
        setSearchResults([]);
      }
    };
    fetchLocations();
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversRes, vehiclesRes] = await Promise.all([
          getDrivers(),
          getVehicles(),
        ]);
        setDrivers(driversRes.data || []);
        setVehicles(vehiclesRes.data || []);
      } catch {
        setError("Failed to load drivers or vehicles");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddWaypoint = (loc) =>
    setWaypoints((prev) => [...prev, loc]);
  const handleDeleteWaypoint = (index) =>
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  const handleClearAll = () => {
    setWaypoints([]);
    setDriverId("");
    setVehicleId("");
    setTripReason("");
    setSelectedDate(null);
    setError("");
  };

  const handleMarkerDrag = async (index, lat, lng) => {
    const name = await getLocationName(lat, lng);
    setWaypoints((prev) =>
      prev.map((wp, i) =>
        i === index ? { ...wp, lat, lng, name } : wp
      )
    );
  };

  const handleAddFromSearch = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    handleAddWaypoint({ name: place.display_name, lat, lng });
    setCenter([lat, lng]);
    setSearch("");
    setSearchResults([]);
  };

  const distances = useMemo(
    () =>
      waypoints.length < 2
        ? []
        : waypoints
            .slice(1)
            .map((wp, i) =>
              haversineDistance(waypoints[i], wp).toFixed(2)
            ),
    [waypoints]
  );

  const totalDistance = useMemo(
    () =>
      distances
        .reduce((acc, val) => acc + parseFloat(val), 0)
        .toFixed(2),
    [distances]
  );

  const handleSubmit = async () => {
    if (
      !driverId ||
      !vehicleId ||
      waypoints.length < 2 ||
      !currentUserId
    ) {
      return setError(
        "Select driver, vehicle, and add at least start + 1 destination."
      );
    }
    if (!tripReason.trim())
      return setError("Provide a reason for the trip.");
    if (!selectedDate)
      return setError("Please select a start date & time for the trip.");

    setLoading(true);
    setError("");
    try {
      const { data: tripData, error: tripError } = await addTrip({
        requester_id: currentUserId,
        driver_id: driverId,
        vehicle_id: vehicleId,
        reason: tripReason.trim(),
        status: "requested",
        distance_travelled: totalDistance,
        start_time: selectedDate, 
      });
      if (tripError) throw tripError;

      for (let i = 0; i < waypoints.length; i++) {
        const wp = waypoints[i];
        const { error: rpError } = await addTripRoutePoint({
          trip_id: tripData.id,
          seq: i + 1,
          name: wp.name,
          lat: wp.lat,
          lng: wp.lng,
        });
        if (rpError)
          console.error("Failed to add route point:", rpError);
      }

      alert("Trip requested successfully!");
      handleClearAll();
    } catch (err) {
      console.error(err);
      setError("Failed to submit trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const availableDrivers = drivers.filter((d) => d.role === "driver");
  const availableVehicles = vehicles.filter(
    (v) => v.status === "active"
  );

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-base-content mb-4 sm:mb-0">
            Request New Trip
          </h1>
          <button
            onClick={handleClearAll}
            disabled={waypoints.length === 0}
            className="btn btn-outline btn-sm flex items-center gap-1"
          >
            <FaWindowClose /> Clear All
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-6 shadow-lg flex items-center gap-2">
            <FaRoute /> <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-base-100 rounded-lg shadow-sm p-6">
            <div className="relative h-[300px] rounded-md border border-neutral-300 overflow-hidden">
              <TripMap
                center={center}
                destinations={waypoints}
                onAddDestination={handleAddWaypoint}
                onMarkerDrag={handleMarkerDrag}
              />
            </div>

            <div className="relative my-6" ref={searchRef}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search location..."
                className="input input-sm w-full"
              />
              {searchResults.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-base-200 border rounded-md shadow-md z-10 max-h-60 overflow-y-auto">
                  {searchResults.map((place) => (
                    <li
                      key={place.place_id}
                      className="px-3 py-2 hover:bg-base-200 cursor-pointer"
                      onMouseDown={() => handleAddFromSearch(place)}
                    >
                      {place.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold opacity-70 mb-3 flex items-center gap-2">
                <FaRoute /> Route Waypoints
              </h3>
              <div className="space-y-3 h-72 overflow-y-auto">
                {waypoints.length > 0 ? (
                  waypoints.map((wp, i) => (
                    <div
                      key={i}
                      className="bg-base-200/50 p-3 rounded-sm border border-base-200 flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="badge badge-sm badge-info mr-2">
                            {i === 0 ? "START" : `${i}`}
                          </span>
                          <span className="text-sm font-medium">
                            {wp.name}
                          </span>
                        </div>
                        {i > 0 && (
                          <p className="text-xs opacity-70">
                            Distance: {distances[i - 1]} km from previous
                          </p>
                        )}
                      </div>
                      <button
                        className="btn btn-sm btn-ghost text-error"
                        onClick={() => handleDeleteWaypoint(i)}
                      >
                        <FaWindowClose className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 opacity-70">
                    <FaPlus className="w-8 h-8 mx-auto mb-2" />
                    <p>Click on the map to add waypoints</p>
                    <p className="text-sm">
                      Start with your location, then add destinations
                    </p>
                  </div>
                )}
              </div>
              <div className="form-control mb-4 mt-2 flex text-xs md:text-sm">
                <label className="label flex items-center gap-2">
                  <RiPinDistanceFill />Total Distance:
                </label>
                <span className="opacity-70 mx-2">
                  {totalDistance} km
                </span>
                <span className="mr-2 opacity-70">|</span>
                <div className="opacity-70">
                  {waypoints.length} waypoint
                  {waypoints.length !== 1 ? "s" : ""} selected
                </div>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Trip Details</h2>

            <Calendar
              selectedDate={selectedDate}
              onDateSelect={(date) => setSelectedDate(date)}
            />

            <div className="form-control mb-4">
              <label className="label flex items-center gap-2">
                <MdDescription /> Trip Reason
              </label>
              <textarea
                value={tripReason}
                onChange={(e) => setTripReason(e.target.value)}
                placeholder="Enter the purpose of this trip..."
                className="textarea textarea-bordered w-full h-24 focus:textarea-primary"
              />
            </div>

            <div className="form-control mb-4">
              <label className="label flex items-center gap-2">
                <MdPerson /> Select Driver
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="select select-bordered w-full focus:select-primary"
              >
                <option value="">Choose a Driver</option>
                {availableDrivers.length === 0 ? (
                  <option disabled>Loading drivers...</option>
                ) : (
                  availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || "Unknown Driver"}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-control mb-6">
              <label className="label flex items-center gap-2">
                <MdDirectionsCar /> Select Vehicle
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="select select-bordered w-full focus:select-primary"
              >
                <option value="">Choose a Vehicle</option>
                {availableVehicles.length === 0 ? (
                  <option disabled>Loading vehicles...</option>
                ) : (
                  availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} - {v.make} {v.model} ({v.year})
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                waypoints.length < 2 ||
                !driverId ||
                !vehicleId ||
                !tripReason.trim() ||
                !selectedDate
              }
              className="btn btn-primary w-full btn-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <FaRoute /> Submit Trip Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
