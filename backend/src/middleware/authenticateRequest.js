const { extractBearerToken, isTokenValid } = require("../config/auth");

const authenticateRequest = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  if (req.path === "/auth/login") {
    return next();
  }

  const token = extractBearerToken(req.headers.authorization);
  if (!token || !isTokenValid(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};

module.exports = authenticateRequest;
