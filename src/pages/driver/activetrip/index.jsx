import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

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

function createStackedIcon(label = "") {
  return L.divIcon({
    className: "custom-stacked-marker",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <img 
          src="https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png" 
          style="width: 25px; height: 41px;" 
        />
        <div 
          style="
            position: absolute;
            bottom: 18px;
            background: #2563eb;
            color: white;
            font-size: 12px;
            font-weight: bold;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          ${label}
        </div>
      </div>
    `,
  });
}

function Routing({ destinations }) {
  const map = useMap();
  const routingControlRef = useRef(null);
  const handlesRef = useRef([]);

  useEffect(() => {
    if (!map || destinations.length < 2) return;

    if (routingControlRef.current) map.removeControl(routingControlRef.current);
    handlesRef.current.forEach((h) => map.removeLayer(h));
    handlesRef.current = [];

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

    routingControlRef.current = control;

    control.on("routesfound", (e) => {
      const route = e.routes[0];
      const coords = route.coordinates;

      coords.forEach((pt, i) => {
        if (i % 20 !== 0) return;

        const handle = L.marker([pt.lat, pt.lng], {
          draggable: true,
          icon: L.divIcon({
            className: "route-handle",
            html: `<div style="width:12px;height:12px;border-radius:50%;background:#2563eb;border:2px solid white;"></div>`,
          }),
        }).addTo(map);

        handle.on("dragend", (ev) => {
          const { lat, lng } = ev.target.getLatLng();
          const newWaypoints = control.getWaypoints().map((wp) => wp.latLng);
          newWaypoints.splice(1, 0, L.latLng(lat, lng));
          control.setWaypoints(newWaypoints);
        });

        handlesRef.current.push(handle);
      });
    });

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      handlesRef.current.forEach((h) => map.removeLayer(h));
      handlesRef.current = [];
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

export default function MapView({ destinations, setDestinations, tracking }) {
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  const handleDragEnd = (id, marker) => {
    const { lat, lng } = marker.getLatLng();
    getLocationName(lat, lng).then((name) => {
      setDestinations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, lat, lng, name } : d))
      );
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (tracking) {
      if (!navigator.geolocation) return;

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
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        center={[0, 0]}
        zoom={13}
        maxZoom={18}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {destinations.map((d, index) => (
          <Marker
            key={d.id}
            position={[d.lat, d.lng]}
            draggable
            icon={createStackedIcon(index + 1)}
            eventHandlers={{
              dragend: (e) => handleDragEnd(d.id, e.target),
            }}
          />
        ))}

        <Routing destinations={destinations} />
        <FitBounds destinations={destinations} />
      </MapContainer>
    </div>
  );
}
