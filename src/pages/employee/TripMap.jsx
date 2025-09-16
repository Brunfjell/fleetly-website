import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationMarker({ onAddDestination }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await res.json();
        const placeName = data.display_name || `Lat: ${lat}, Lng: ${lng}`;
        onAddDestination({ lat, lng, name: placeName });
      } catch (err) {
        console.error("Reverse geocode failed:", err);
        onAddDestination({ lat, lng, name: `Lat: ${lat}, Lng: ${lng}` });
      }
    },
  });
  return null;
}

function Routing({ destinations }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    let routingControl;

    if (destinations.length > 1) {
      routingControl = L.Routing.control({
        waypoints: destinations.map((d) => L.latLng(d.lat, d.lng)),
        lineOptions: { styles: [{ color: "blue", weight: 4 }] },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        createMarker: () => null,
      }).addTo(map);
    }

    return () => {
      if (routingControl) map.removeControl(routingControl);
    };
  }, [map, destinations]);

  return null;
}

export default function TripMap({ center, destinations, onAddDestination, onMarkerDrag }) {
  return (
    <MapContainer center={center} zoom={13} style={{ height: "500px", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onAddDestination={onAddDestination} />

      {destinations.map((d, i) => (
        <Marker
          key={i}
          position={[d.lat, d.lng]}
          draggable={!d.locked}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              onMarkerDrag(i, lat, lng);
            },
          }}
        >
          <Popup>{d.name}</Popup>
        </Marker>
      ))}

      <Routing destinations={destinations} />
    </MapContainer>
  );
}
