// middlewares/auth.js
const jwt = require("jsonwebtoken");

/* ① Authenticate any token (admin or patient) */
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;           // "admin" or "patient"
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* ② Authorise only admins */
const protectAdminOnly = (req, res, next) => {
  if (req.userRole !== "Admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

/* ─── Export both ways ──────────────────────────────────────────── */
// default export is the auth function (works for `guard`)
module.exports = authenticate;

// named exports still work for destructuring in app.js
module.exports.authenticate = authenticate;
module.exports.protectAdminOnly = protectAdminOnly;
