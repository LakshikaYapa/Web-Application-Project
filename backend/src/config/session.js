const SESSION_COOKIE_NAME = "floodguard.sid";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function cookieOptions(secure) {
  return { httpOnly: true, secure, sameSite: "strict", path: "/api" };
}

module.exports = { SESSION_COOKIE_NAME, SESSION_DURATION_MS, cookieOptions };
