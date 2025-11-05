// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET ;

export const protect = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!token) return res.status(401).json({ message: "Not authenticated." });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
