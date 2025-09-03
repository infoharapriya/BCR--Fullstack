// middleware/auth.js (ESM)

import jwt from "jsonwebtoken";

function auth(requiredRole = null) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // { id, role, name }

      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

export default auth;
