const crypto = require("crypto");

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const issuedTokens = new Map();

const safeCompare = (left, right) => {
  const leftBuffer = Buffer.from(String(left || "").trim());
  const rightBuffer = Buffer.from(String(right || "").trim());

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const getConfiguredCredentials = () => ({
  username: process.env.APP_USERNAME || "PUNNAM444",
  password: process.env.APP_PASSWORD || "PUNNAM444"
});

const validateLogin = (username, password) => {
  const configured = getConfiguredCredentials();
  return safeCompare(username, configured.username) && safeCompare(password, configured.password);
};

const issueAuthToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  issuedTokens.set(token, Date.now() + TOKEN_TTL_MS);
  return token;
};

const isTokenValid = (token) => {
  const expiresAt = issuedTokens.get(token);
  if (!expiresAt) {
    return false;
  }

  if (Date.now() > expiresAt) {
    issuedTokens.delete(token);
    return false;
  }

  return true;
};

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return "";
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return "";
  }

  return token.trim();
};

module.exports = {
  extractBearerToken,
  isTokenValid,
  issueAuthToken,
  validateLogin
};
