import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "../i18n/useLanguage";

export default function ReportLocationPicker({ coordinates, onChange }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).fitBounds([[5.85, 79.5], [9.95, 82.05]]);
    mapRef.current = map;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    map.on("click", ({ latlng }) => {
      if (latlng.lat >= 5.85 && latlng.lat <= 9.95 && latlng.lng >= 79.5 && latlng.lng <= 82.05) onChange({ latitude: latlng.lat.toFixed(6), longitude: latlng.lng.toFixed(6) });
    });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; markerRef.current = null; };
  }, [onChange]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
    if (coordinates.latitude === "" || coordinates.longitude === "") return;
    const latitude = Number(coordinates.latitude), longitude = Number(coordinates.longitude);
    if (Number.isFinite(latitude) && latitude >= 5.85 && latitude <= 9.95 && Number.isFinite(longitude) && longitude >= 79.5 && longitude <= 82.05) {
      markerRef.current = L.circleMarker([latitude, longitude], { radius: 9, color: "#fff", weight: 3, fillColor: "#d94848", fillOpacity: 1 }).addTo(map);
      map.panTo([latitude, longitude]);
    }
  }, [coordinates]);
  return <div className="mt-6">
    <h3 className="font-bold">{t("Pin the flood location")} <span aria-hidden="true">*</span></h3>
    <p id="report-map-hint" className="mt-2 text-sm leading-7">{t("Zoom in and select the exact location on the map, or enter its latitude and longitude.")}</p>
    <div ref={containerRef} className="relative z-0 mt-3 h-72 overflow-hidden rounded-xl border border-[#73aaa3]" role="region" aria-label={t("Choose report location on the map")} aria-describedby="report-map-hint" />
    <div className="mt-4 grid gap-4 min-[600px]:grid-cols-2">
      <label htmlFor="report-latitude" className="font-semibold">{t("Latitude")}<input id="report-latitude" name="latitude" type="number" required step="any" min="5.85" max="9.95" value={coordinates.latitude} onChange={(event) => onChange({ ...coordinates, latitude: event.target.value })} className="mt-2 w-full rounded-lg border border-[#73aaa3] bg-white p-3 dark:bg-[#12343d]" /></label>
      <label htmlFor="report-longitude" className="font-semibold">{t("Longitude")}<input id="report-longitude" name="longitude" type="number" required step="any" min="79.5" max="82.05" value={coordinates.longitude} onChange={(event) => onChange({ ...coordinates, longitude: event.target.value })} className="mt-2 w-full rounded-lg border border-[#73aaa3] bg-white p-3 dark:bg-[#12343d]" /></label>
    </div>
  </div>;
}
