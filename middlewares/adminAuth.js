import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.ADMIN_JWT_SECRET 

export const adminProtect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized." });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.adminId = verified.id;
    req.adminRole = verified.role;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }
};

export const developerOnly = (req, res, next) => {
  if (req.adminRole !== "developer")
    return res.status(403).json({ message: "Access denied (developer only)." });

  next();
};
