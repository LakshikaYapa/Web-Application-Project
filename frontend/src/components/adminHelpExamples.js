export const adminHelpExamples = [
  {
    id: "preview-help-001", helpType: "Food and drinking water", nearestTown: "Kandy",
    location: "Near the community hall, Lake Road", phone: "0000000000",
    description: "Five families need drinking water and dry food. Road access is available for small vehicles.",
    status: "pending", createdAt: "2026-10-30T03:00:00.000Z", photoCount: 0,
  },
  {
    id: "preview-help-002", helpType: "Shelter", nearestTown: "Gampaha",
    location: "Near the school entrance, Station Road", phone: "0000000000",
    description: "Two families with children need temporary accommodation after water entered their homes.",
    status: "pending", createdAt: "2026-10-30T02:30:00.000Z", photoCount: 0,
  },
  {
    id: "preview-help-003", helpType: "Other help", otherHelp: "Bedding and hygiene supplies", nearestTown: "Peradeniya",
    location: "At the community centre, River Road", phone: "0000000000",
    description: "Families staying at the community centre need blankets, sleeping mats and hygiene supplies.",
    status: "pending", createdAt: "2026-10-30T02:00:00.000Z", photoCount: 0,
  },
];

function reviewedExamples() {
  try {
    const ids = JSON.parse(sessionStorage.getItem("floodguard-reviewed-help-examples") || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch { return []; }
}

export function pendingHelpExamples() {
  const reviewed = reviewedExamples();
  return adminHelpExamples.filter((request) => !reviewed.includes(request.id));
}

export function reviewHelpExample(id) {
  try { sessionStorage.setItem("floodguard-reviewed-help-examples", JSON.stringify([...new Set([...reviewedExamples(), id])])); } catch { /* The current page still updates if storage is unavailable. */ }
}
