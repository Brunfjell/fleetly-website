export async function getLocationName(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data.display_name || `Lat:${lat.toFixed(3)}, Lng:${lng.toFixed(3)}`;
  } catch (err) {
    console.error("Reverse geocode failed", err);
    return `Lat:${lat.toFixed(3)}, Lng:${lng.toFixed(3)}`;
  }
}
