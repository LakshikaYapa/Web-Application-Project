export const adminFloodExamples = [
  { id: "preview-flood-001", nearestTown: "Kandy", location: "Near the bridge, River Road", phone: "0000000000", situations: ["road", "rising_water"], description: "Water is rising near the bridge and covering part of the road.", status: "pending", createdAt: "2026-10-30T03:00:00.000Z", photoCount: 0 },
  { id: "preview-flood-002", nearestTown: "Gampaha", location: "Near the junction, Station Road", phone: "0000000000", situations: ["homes"], description: "Water has entered several ground-floor homes near the junction.", status: "pending", createdAt: "2026-10-30T02:30:00.000Z", photoCount: 0 },
  { id: "preview-flood-003", nearestTown: "Peradeniya", location: "Near the community centre, Main Road", phone: "0000000000", situations: ["road", "other"], otherSituation: "Debris blocking the roadside drain", description: "A blocked drain is causing water to collect along the road.", status: "pending", createdAt: "2026-10-30T02:00:00.000Z", photoCount: 0 },
];

function reviewedExamples() {
  try {
    const ids = JSON.parse(sessionStorage.getItem("floodguard-reviewed-flood-examples") || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch { return []; }
}

export function pendingFloodExamples() {
  const reviewed = reviewedExamples();
  return adminFloodExamples.filter((report) => !reviewed.includes(report.id));
}

export function reviewFloodExample(id) {
  try { sessionStorage.setItem("floodguard-reviewed-flood-examples", JSON.stringify([...new Set([...reviewedExamples(), id])])); } catch { /* The current page still updates if storage is unavailable. */ }
}
