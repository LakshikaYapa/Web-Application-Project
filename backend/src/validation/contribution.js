const SUPPORT_TYPES = Object.freeze(["financial", "food_water", "shelter", "relief", "other"]);

function validateContribution(body, receipt) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Send contribution details." } };
  const errors = {};
  if (Object.keys(body).some((field) => !["supportTypes", "nearestTown", "phone", "otherSupport", "notes", "amount"].includes(field))) errors.body = "Unexpected contribution fields.";
  const types = typeof body.supportTypes === "string" ? [body.supportTypes] : body.supportTypes;
  if (!Array.isArray(types) || !types.length || types.length > SUPPORT_TYPES.length || types.some((type) => !SUPPORT_TYPES.includes(type)) || new Set(types).size !== types.length) errors.supportTypes = "Select distinct support types.";
  if (typeof body.nearestTown !== "string" || !body.nearestTown.trim() || body.nearestTown.trim().length > 100) errors.nearestTown = "Enter a town in 1 to 100 characters.";
  const phone = typeof body.phone === "string" ? body.phone.replace(/[\s()-]/g, "") : "";
  if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(phone)) errors.phone = "Enter a valid Sri Lankan phone number.";
  const other = Array.isArray(types) && types.includes("other");
  const financial = Array.isArray(types) && types.includes("financial");
  for (const [field, max] of [["otherSupport", 500], ["notes", 1000]]) {
    if (body[field] !== undefined && (typeof body[field] !== "string" || body[field].trim().length > max)) errors[field] = `Use at most ${max} characters.`;
  }
  if (other && (typeof body.otherSupport !== "string" || !body.otherSupport.trim())) errors.otherSupport = "Describe your other support.";
  if (!other && body.otherSupport !== undefined && body.otherSupport !== "") errors.otherSupport = "Select Other support to use this field.";
  let amountMinor;
  if (financial) {
    // Store whole cents, avoiding floating point rounding of payment amounts.
    const amount = typeof body.amount === "string" ? body.amount.trim() : "";
    if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(amount)) errors.amount = "Enter a positive LKR amount with up to two decimal places.";
    else {
      const [whole, cents = ""] = amount.split(".");
      amountMinor = Number(whole) * 100 + Number(cents.padEnd(2, "0"));
      if (amountMinor <= 0) errors.amount = "Enter a positive LKR amount.";
    }
    if (!receipt) errors.receipt = "Attach a payment receipt.";
  } else if (body.amount !== undefined || receipt) errors.financial = "Select Financial support to provide an amount or receipt.";
  if (Object.keys(errors).length) return { errors };
  return { value: {
    supportTypes: [...types], nearestTown: body.nearestTown.trim(), phone: phone.startsWith("0") ? `+94${phone.slice(1)}` : phone,
    otherSupport: other ? body.otherSupport.trim() : "", notes: body.notes?.trim() || "",
    ...(financial ? { amountMinor, currency: "LKR", receipt: { contentType: receipt.mimetype, data: receipt.buffer } } : {}),
  } };
}

module.exports = { SUPPORT_TYPES, validateContribution };
