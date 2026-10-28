const PUBLIC_ROLES = Object.freeze(["volunteer", "help_seeker", "funder"]);
const ACCOUNT_ROLES = Object.freeze([...PUBLIC_ROLES, "admin"]);

// Public registration must use this allowlist, not the full account-role list.
function isPublicRole(role) {
  return typeof role === "string" && PUBLIC_ROLES.includes(role);
}

function isPublicRoles(roles) {
  return Array.isArray(roles) && roles.length >= 1 && roles.length <= PUBLIC_ROLES.length
    && roles.every(isPublicRole) && new Set(roles).size === roles.length;
}

module.exports = { PUBLIC_ROLES, ACCOUNT_ROLES, isPublicRole, isPublicRoles };
