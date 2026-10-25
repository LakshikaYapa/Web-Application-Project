import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const islandBounds = [[5.85, 79.5], [9.95, 82.05]];
const demoLocations = [
  { name: "Colombo", position: [6.9271, 79.8612], type: "Reported issue", color: "#13a8da" },
  { name: "Gampaha", position: [7.084, 80.0098], type: "Severe flooding", color: "#ee526d" },
  { name: "Kandy", position: [7.2906, 80.6337], type: "Shelter", color: "#008b78" },
  { name: "Matara", position: [5.9549, 80.555], type: "Flooded area", color: "#ffb52e" },
];

export default function FloodMapPreview() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false, doubleClickZoom: false, minZoom: 6, maxZoom: 18,
    });
    mapRef.current = map;
    map.fitBounds(islandBounds, { padding: [10, 10] });
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    const zoomToArea = (position) => map.setView(position, Math.min(map.getZoom() + 2, 18));
    map.on("click", (event) => zoomToArea(event.latlng));
    demoLocations.forEach(({ name, position, type, color }) => {
      const marker = L.marker(position, {
        title: `${name}: ${type} (demo). Select to zoom in.`,
        alt: `${name} demo marker`,
        icon: L.divIcon({
          className: "demo-map-marker",
          html: `<span style="background:${color}"></span>`,
          iconSize: [22, 22], iconAnchor: [11, 11],
        }),
      }).addTo(map);
      const content = document.createElement("p");
      content.textContent = `${name}: ${type} - demo only, not a current report.`;
      marker.bindPopup(content);
      marker.on("click", () => zoomToArea(position));
    });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <section className="flood-map-card" aria-labelledby="flood-map-title">
      <div className="flood-map-heading">
        <h2 id="flood-map-title">Flood situation map</h2>
        <span className="demo-badge">Demo data</span>
      </div>
      <p className="map-instructions" id="map-instructions">Click an area to zoom in. Drag to explore or use the + / - controls.</p>
      <div ref={containerRef} className="sri-lanka-map" role="region" aria-label="Interactive Sri Lanka map" aria-describedby="map-instructions map-demo-note" />
      {tileError && <p role="status" className="map-demo-note">Some map tiles could not load. Check your internet connection and reload the page.</p>}
      <ul className="map-legend" aria-label="Demo marker legend">
        {demoLocations.map(({ type, color }) => (
          <li key={type}><span className="legend-dot" style={{ background: color }} aria-hidden="true" />{type}</li>
        ))}
      </ul>
      <p className="map-demo-note" id="map-demo-note">Sample markers only. Not live flood or shelter information. Map tiles require an internet connection.</p>
      <button className="map-preview-button" type="button" onClick={() => mapRef.current?.fitBounds(islandBounds, { padding: [10, 10] })}>Show all Sri Lanka</button>
    </section>
  );
}
