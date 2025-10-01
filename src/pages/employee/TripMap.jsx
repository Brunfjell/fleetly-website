import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createNumberedOverlay = (number, color = "blue") =>
  L.divIcon({
    className: "custom-marker-label",
    html: `
      <div style="
        background:${color};
        color:white;
        border-radius:50%;
        width:22px;
        height:22px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:12px;
        font-weight:bold;
        border:2px solid white;
        box-shadow:0 0 2px rgba(0,0,0,0.5);
      ">
        ${number}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 40],
    popupAnchor: [0, -32],
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
        const placeName =
          data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        onAddDestination({ lat, lng, name: placeName });
      } catch {
        onAddDestination({
          lat,
          lng,
          name: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
        });
      }
    },
  });
  return null;
}

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

function Routing({ destinations }) {
  const map = useMap();

  useEffect(() => {
    if (!map || destinations.length < 2) return;

    const routingControl = L.Routing.control({
      waypoints: destinations.map((d) => L.latLng(d.lat, d.lng)),
      lineOptions: { styles: [{ color: "blue", weight: 4 }] },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      createMarker: () => null,
    }).addTo(map);

    return () => {
      if (routingControl) map.removeControl(routingControl);
    };
  }, [map, destinations]);

  return null;
}

export default function TripMap({
  center,
  destinations,
  onAddDestination,
  onMarkerDrag,
}) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Recenter center={center} />
      <LocationMarker onAddDestination={onAddDestination} />

      {destinations.map((d, i) => {
        let color = "blue";
        if (i === 0) color = "green";
        else if (i === destinations.length - 1) color = "red";

        return (
          <>
            <Marker
              key={`main-${i}`}
              position={[d.lat, d.lng]}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  onMarkerDrag(i, lat, lng);
                },
              }}
            >
              <Popup>
                <b>
                  {i === 0
                    ? "Start: "
                    : i === destinations.length - 1
                    ? "End: "
                    : "Stop: "}
                </b>
                {d.name}
              </Popup>
            </Marker>

            <Marker
              key={`label-${i}`}
              position={[d.lat, d.lng]}
              icon={createNumberedOverlay(i + 1, color)}
              interactive={false}
            />
          </>
        );
      })}

      <Routing destinations={destinations} />
    </MapContainer>
  );
}
