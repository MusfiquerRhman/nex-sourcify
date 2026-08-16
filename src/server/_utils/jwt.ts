import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Sign a JWT with a payload and a 18-hour expiration
export function signJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "18h", algorithm: "HS256" });
}

export function verifyJwt<T>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as T;
  } catch {
    return null;
  }
}
