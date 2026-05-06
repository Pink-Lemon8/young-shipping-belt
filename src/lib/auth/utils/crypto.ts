// Server-side only crypto utilities
import * as crypto from "crypto";

// Hash a password with scrypt (Better Auth compatible)
export function hashPassword(
  password: string,
  saltSize = 16,
  length = 64
): string {
  // Use native Node.js crypto functions when running on server
  if (typeof window === "undefined") {
    const salt = crypto.randomBytes(saltSize).toString("hex");
    // Use scrypt for Better Auth compatibility
    const hash = crypto.scryptSync(password, salt, length).toString("hex");
    return `${salt}:${hash}`;
  } else {
    // Mock for client-side (should never be used in production)
    console.warn("Password hashing should not be performed on client-side");
    return "client-side-hashing-not-supported";
  }
}

// Verify a password against a stored hash
export async function verifyPassword(
  storedPassword: string,
  suppliedPassword: string
): Promise<boolean> {
  if (!storedPassword) return false;

  // Use native Node.js crypto functions when running on server
  if (typeof window === "undefined") {
    try {
      console.log(
        `Verifying password - Stored format: ${storedPassword.includes(":") ? "valid" : "invalid"}`
      );
      const [salt, hash] = storedPassword.split(":");

      if (!salt || !hash) {
        console.error("Invalid stored password format");
        return false;
      }

      console.log(`Extracted salt: ${salt}`);
      console.log(`Salt length: ${salt.length}`);

      const suppliedHash = crypto
        .scryptSync(suppliedPassword, salt, 64)
        .toString("hex");
      const result = hash === suppliedHash;

      console.log(`Hash comparison: ${result}`);
      console.log(`Supplied hash length: ${suppliedHash.length}`);
      console.log(`Stored hash length: ${hash.length}`);

      return result;
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  } else {
    // Mock for client-side (should never be used in production)
    console.warn(
      "Password verification should not be performed on client-side"
    );
    return false;
  }
}

// Generate a unique random ID
export function generateId(prefix = "", size = 16): string {
  if (typeof window === "undefined") {
    return prefix + crypto.randomBytes(size).toString("hex");
  } else {
    // Mock for client-side
    console.warn("ID generation should not be performed on client-side");
    return prefix + new Date().getTime().toString();
  }
}
