import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { v4 as uuidv4 } from "uuid";

async function getLocationName(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  } catch {
    return `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  }
}

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowUrl: undefined,
});

function Routing({ destinations }) {
  const map = useMap();

  useEffect(() => {
    if (!map || destinations.length < 2) return;

    const control = L.Routing.control({
      waypoints: destinations.map((d) => L.latLng(d.lat, d.lng)),
      lineOptions: { styles: [{ color: "blue", weight: 4 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: () => null,

      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
    }).addTo(map);

    return () => {
      if (control) map.removeControl(control);
    };
  }, [map, destinations]);

  return null;
}


function FitBounds({ destinations }) {
  const map = useMap();

  useEffect(() => {
    if (!map || destinations.length === 0) return;

    if (destinations.length === 1) {
      map.setView([destinations[0].lat, destinations[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(destinations.map((d) => [d.lat, d.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, destinations]);

  return null;
}

function ClickHandler({ setDestinations }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setDestinations((prev) => [
        ...prev,
        { id: uuidv4(), name: `Stop ${prev.length + 1}`, lat, lng },
      ]);
    },
  });
  return null;
}

export default function MapView({ destinations, setDestinations }) {
  const handleDragEnd = (id, marker) => {
    const { lat, lng } = marker.getLatLng();
    getLocationName(lat, lng).then((name) => {
      setDestinations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, lat, lng, name } : d))
      );
    });
  };

  return (
    <MapContainer
      center={[0, 0]} 
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler setDestinations={setDestinations} />

      {destinations.map((d) => (
        <Marker
          key={d.id}
          position={[d.lat, d.lng]}
          draggable
          icon={icon}
          eventHandlers={{
            dragend: (e) => handleDragEnd(d.id, e.target),
          }}
        />
      ))}

      <Routing destinations={destinations} />
      <FitBounds destinations={destinations} />
    </MapContainer>
  );
}
