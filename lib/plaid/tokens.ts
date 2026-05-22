import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const VERSION = "v1";

function getTokenKey(): Buffer {
  const secret =
    process.env.PLAID_TOKEN_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "material-muse-local-sandbox-only";

  return createHash("sha256").update(secret).digest();
}

export function encryptAccessToken(accessToken: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getTokenKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(accessToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptAccessToken(encryptedToken: string): string {
  const [version, iv, tag, ciphertext] = encryptedToken.split(".");
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error("Invalid encrypted Plaid token format.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getTokenKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
