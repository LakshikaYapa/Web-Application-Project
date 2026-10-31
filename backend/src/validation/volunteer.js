const AREA_SKILLS = Object.freeze({
  relief: ["Packing supplies", "Food preparation", "Distributing essentials", "Stock management"],
  transport: ["Driving", "Route planning", "Loading and unloading", "Vehicle maintenance"],
  community: ["Shelter assistance", "Translation", "Child and elder support", "Community coordination"],
  other: ["Communication", "Organising activities"],
});
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function validateVolunteer(body) {
  const errors = {};
  if (!isObject(body)) return { errors: { body: "Send a JSON object." } };
  if (Object.keys(body).some((key) => !["nearestTown", "areas"].includes(key))) errors.body = "Unexpected volunteer fields.";
  if (typeof body.nearestTown !== "string" || !body.nearestTown.trim() || body.nearestTown.trim().length > 100) errors.nearestTown = "Enter a town in 1 to 100 characters.";
  if (!isObject(body.areas) || !Object.keys(body.areas).length || Object.keys(body.areas).some((area) => !Object.hasOwn(AREA_SKILLS, area))) {
    errors.areas = "Select one or more valid support areas.";
  }
  const supportAreas = [];
  if (!errors.areas) for (const [area, details] of Object.entries(body.areas)) {
    const field = `areas.${area}`;
    if (!isObject(details) || Object.keys(details).some((key) => !["skills", "otherSkills", "otherSupport"].includes(key))) {
      errors[field] = "Send valid support details.";
      continue;
    }
    const allowedSkills = [...AREA_SKILLS[area], "Other skills"];
    if (!Array.isArray(details.skills) || !details.skills.length || details.skills.length > allowedSkills.length
      || details.skills.some((skill) => !allowedSkills.includes(skill)) || new Set(details.skills).size !== details.skills.length) {
      errors[`${field}.skills`] = "Select one or more distinct skills for this area.";
      continue;
    }
    const values = {};
    for (const [name, max, required] of [["otherSkills", 500, details.skills.includes("Other skills")], ["otherSupport", 200, area === "other"]]) {
      const text = details[name] === undefined ? "" : details[name];
      if (typeof text !== "string" || text.trim().length > max || (required ? !text.trim() : Boolean(text.trim()))) {
        errors[`${field}.${name}`] = required ? `Enter 1 to ${max} characters.` : "Use custom details only with the Other option.";
      } else values[name] = text.trim();
    }
    supportAreas.push({ area, skills: [...details.skills], ...values });
  }
  return Object.keys(errors).length ? { errors } : { value: { nearestTown: body.nearestTown.trim(), supportAreas } };
}

module.exports = { AREA_SKILLS, validateVolunteer };
