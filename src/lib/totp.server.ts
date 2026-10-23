/**
 * Minimal RFC 6238 TOTP implementation (SHA-1, 6 digits, 30s step) plus the
 * signed "2FA unlocked" cookie used to gate the super admin console.
 * Runs on the server only.
 */
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateSecret(bytes = 20): string {
  const buf = randomBytes(bytes);
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += B32[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

function base32Decode(secret: string): Buffer {
  const clean = secret.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  let bits = "";
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac("sha1", key).update(buf).digest();
  const offset = (digest[digest.length - 1] as number) & 0x0f;
  const code =
    (((digest[offset] as number) & 0x7f) << 24) |
    (((digest[offset + 1] as number) & 0xff) << 16) |
    (((digest[offset + 2] as number) & 0xff) << 8) |
    ((digest[offset + 3] as number) & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

/** Accepts the current code and one step before/after (clock drift tolerance). */
export function verifyTotp(secret: string, token: string): boolean {
  const clean = token.replace(/\D/g, "");
  if (clean.length !== 6) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (const drift of [-1, 0, 1]) {
    const expected = hotp(secret, counter + drift);
    const a = Buffer.from(expected);
    const b = Buffer.from(clean);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

export function otpauthUrl(secret: string, account: string, issuer = "AA100XTech"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
    account,
  )}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(5).toString("hex").toUpperCase().replace(/(.{5})/, "$1-"),
  );
}

/* ------------------------------------------------- signed unlock cookie */

const COOKIE = "aa_2fa";
const TTL_MS = 12 * 60 * 60 * 1000;

function secret(): string {
  return process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_SECRET_KEY"] ?? "dev";
}

export function signUnlockToken(userId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${userId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyUnlockToken(token: string | null | undefined, userId: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [uid, exp, sig] = parts as [string, string, string];
  if (uid !== userId) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = createHmac("sha256", secret()).update(`${uid}.${exp}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unlockCookie(token: string): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${TTL_MS / 1000}`;
}

export function clearUnlockCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export function readUnlockToken(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === COOKIE) return rest.join("=");
  }
  return null;
}
