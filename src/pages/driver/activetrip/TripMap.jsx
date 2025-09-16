import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import L from "leaflet";
import { useEffect, useRef } from "react";

export default function ActiveTrip({ trip, onDestinationsChange }) {
  const mapRef = useRef(null);
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    routingControlRef.current = L.Routing.control({
      waypoints: trip.destinations.map(d => L.latLng(d.lat, d.lng)),
      routeWhileDragging: true,
      draggableWaypoints: true,
      addWaypoints: true, 
      show: false,
      createMarker: (i, waypoint, n) => {
        return L.marker(waypoint.latLng, {
          draggable: true,
        }).on("dragend", (e) => {
          const updated = [...trip.destinations];
          updated[i] = {
            lat: e.target.getLatLng().lat,
            lng: e.target.getLatLng().lng,
          };
          onDestinationsChange(updated);
        });
      },
    })
      .on("waypointschanged", (e) => {
        const updated = e.waypoints.map(wp => ({
          lat: wp.latLng.lat,
          lng: wp.latLng.lng,
        }));
        onDestinationsChange(updated);
      })
      .addTo(map);

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [trip]);

  return (
    <MapContainer
      center={[trip.destinations[0].lat, trip.destinations[0].lng]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
    </MapContainer>
  );
}
