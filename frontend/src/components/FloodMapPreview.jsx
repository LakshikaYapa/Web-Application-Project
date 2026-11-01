import { useLanguage } from "../i18n/useLanguage";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const islandBounds = [[5.85, 79.5], [9.95, 82.05]];
const legend = [
  { id: "homes", label: "Flooded homes", color: "#ee526d" },
  { id: "rising_water", label: "Rising water", color: "#13a8da" },
  { id: "road", label: "Flooded road", color: "#ffb52e" },
  { id: "other", label: "Other situation", color: "#008b78" },
];

export default function FloodMapPreview() {
  const { t, language } = useLanguage();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const viewRef = useRef(null);
  const [tileError, setTileError] = useState(false);
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function load() {
      try {
        const response = await fetch("/api/flood-reports/map", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.reports)) throw new Error("Map reports unavailable");
        if (!controller.signal.aborted) { setReports(body.reports); setHasMore(Boolean(body.hasMore)); setError(false); }
      } catch {
        if (!controller.signal.aborted) { setError(true); setReports([]); }
      } finally { if (!controller.signal.aborted) timer = setTimeout(load, 30000); }
    }
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [retry]);

  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false, doubleClickZoom: false, minZoom: 6, maxZoom: 18, zoomControl: false });
    mapRef.current = map;
    if (viewRef.current) map.setView(viewRef.current.center, viewRef.current.zoom);
    else map.fitBounds(islandBounds, { padding: [10, 10] });
    L.control.zoom({ zoomInTitle: t("Zoom in"), zoomOutTitle: t("Zoom out") }).addTo(map);
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    markersRef.current = L.layerGroup().addTo(map);
    map.on("click", (event) => map.setView(event.latlng, Math.min(map.getZoom() + 2, 18)));
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    return () => { observer.disconnect(); viewRef.current = { center: map.getCenter(), zoom: map.getZoom() }; map.remove(); mapRef.current = null; markersRef.current = null; };
  }, [t]);

  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;
    group.clearLayers();
    for (const report of reports || []) {
      const type = legend.find((item) => report.situations.includes(item.id)) || legend[3];
      const marker = L.marker([report.latitude, report.longitude], {
        title: `${report.nearestTown}: ${t(type.label)}`, alt: `${report.nearestTown}: ${t("Approved flood report")}`,
        icon: L.divIcon({ className: "demo-map-marker", html: `<span style="background:${type.color}"></span>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
      }).addTo(group);
      const content = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = report.nearestTown; content.append(title);
      for (const text of [report.location, report.situations.map((id) => t(legend.find((item) => item.id === id)?.label || "Other situation")).join(", "), report.description, `${t("Reported on")}: ${new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(report.createdAt))}`]) {
        const paragraph = document.createElement("p"); paragraph.textContent = text; content.append(paragraph);
      }
      marker.bindPopup(content, { maxWidth: 280 });
    }
  }, [reports, t, language]);

  return <section className="flood-map-card" aria-labelledby="flood-map-title">
    <div className="flood-map-heading"><h2 id="flood-map-title">{t("Flood situation map")}</h2><span className="rounded-full bg-[#cce6db] px-3 py-1 text-xs font-semibold text-[#005849]">{t("Approved reports")}</span></div>
    <p className="map-instructions" id="map-instructions">{t("Click an area to zoom in. Drag to explore or use the + / - controls.")}</p>
    <div ref={containerRef} className="sri-lanka-map" role="region" aria-label={t("Interactive Sri Lanka map")} aria-describedby="map-instructions map-report-note" />
    {tileError && <p role="status" className="map-demo-note">{t("Some map tiles could not load. Check your internet connection and reload the page.")}</p>}
    {error ? <p role="alert" className="map-demo-note">{t("Unable to load map reports. Please refresh.")}</p> : reports === null ? <p role="status">{t("Loading flood reports…")}</p> : !reports.length && <p role="status" className="map-demo-note">{t("No approved reports with a map location yet.")}</p>}
    <ul className="map-legend" aria-label={t("Flood report marker legend")}>{legend.map((item) => <li key={item.id}><span className="legend-dot" style={{ background: item.color }} aria-hidden="true" />{t(item.label)}</li>)}</ul>
    <p className="map-demo-note" id="map-report-note">{t("Only approved reports with a selected map location appear here. Check the reported date before relying on a report.")}</p>
    {hasMore && <a href="/report-flood#approved-flood-reports" className="text-sm underline">{t("View more approved reports")}</a>}
    <div className="mt-3 flex flex-wrap gap-3"><button className="map-preview-button" type="button" onClick={() => mapRef.current?.fitBounds(islandBounds, { padding: [10, 10] })}>{t("Show all Sri Lanka")}</button><button type="button" onClick={() => setRetry((value) => value + 1)} className="rounded-lg border border-[#73aaa3] px-4 py-2 font-semibold">{t("Refresh list")}</button></div>
  </section>;
}
