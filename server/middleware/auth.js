import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_env";

/**
 * Middleware untuk memverifikasi token JWT pada header Authorization.
 * Format header: "Authorization: Bearer <token>"
 * Jika valid, req.userId akan berisi id pengguna yang sedang login.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan. Silakan login kembali." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
  }
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
