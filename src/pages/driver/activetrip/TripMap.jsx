import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import "leaflet-routing-machine";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function ActiveTrip({ trip, onDestinationsChange, tracking }) {
  const mapRef = useRef(null);
  const routingControlRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || trip.destinations.length < 2) return;
    const map = mapRef.current;

    if (routingControlRef.current) map.removeControl(routingControlRef.current);

    routingControlRef.current = L.Routing.control({
      waypoints: trip.destinations.map((d) => L.latLng(d.lat, d.lng)),
      routeWhileDragging: true,
      draggableWaypoints: true,
      addWaypoints: false,
      show: false,
      createMarker: (i, wp) => {
        return L.marker(wp.latLng, {
          draggable: true,
          icon: defaultIcon,
        }).on("dragend", (e) => {
          const updated = [...trip.destinations];
          updated[i] = {
            lat: e.target.getLatLng().lat,
            lng: e.target.getLatLng().lng,
          };
          onDestinationsChange(updated);
        });
      },
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
    }).addTo(map);

    return () => {
      if (routingControlRef.current) map.removeControl(routingControlRef.current);
    };
  }, [trip]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tracking && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 15, { animate: true });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [tracking]);

  return (
    <MapContainer
      center={[
        trip.destinations[0]?.lat || 0,
        trip.destinations[0]?.lng || 0,
      ]}
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
