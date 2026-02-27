import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { ClaimedUser } from '../models/ClaimedUser.js';

/** Parse Basic auth header: "Basic base64(name:password)" -> { name, password } or null */
export function parseBasicAuth(req: Request): { name: string; password: string } | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
    const idx = decoded.indexOf(':');
    if (idx <= 0) return null;
    const name = decoded.slice(0, idx).trim();
    const password = decoded.slice(idx + 1);
    if (!name || password === undefined) return null;
    return { name, password };
  } catch {
    return null;
  }
}

/** Normalize name for case-insensitive lookup (same as MongoDB collation) */
function normalizeName(name: string): string {
  return name.trim();
}

/** Verify that (name, password) matches a ClaimedUser. Returns the ClaimedUser doc or null. */
export async function verifyClaimedUser(
  name: string,
  password: string
): Promise<InstanceType<typeof ClaimedUser> | null> {
  const n = normalizeName(name);
  if (!n || !password) return null;
  const user = await ClaimedUser.findOne({ name: n }).collation({ locale: 'en', strength: 2 });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

/** Check if a display name is claimed (exists in ClaimedUser). Case-insensitive. */
export async function isNameClaimed(name: string): Promise<boolean> {
  const n = normalizeName(name);
  if (!n) return false;
  const user = await ClaimedUser.findOne({ name: n }).collation({ locale: 'en', strength: 2 }).select('_id').lean();
  return !!user;
}

/** Express middleware: require valid Basic auth for a claimed user. Sets req.claimedUser. */
export async function requireClaimedAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const creds = parseBasicAuth(req);
  if (!creds) {
    res.status(401).json({ error: 'Missing or invalid authorization. Use Basic auth with your name and password.' });
    return;
  }
  const user = await verifyClaimedUser(creds.name, creds.password);
  if (!user) {
    res.status(401).json({ error: 'Invalid name or password.' });
    return;
  }
  (req as Request & { claimedUser: InstanceType<typeof ClaimedUser> }).claimedUser = user;
  next();
}

/**
 * If `username` is a claimed name, verify the request has Basic auth for that user.
 * Returns true if OK to use this username; sends 403 and returns false otherwise.
 */
export async function assertCanUseClaimedName(
  username: string,
  req: Request,
  res: Response
): Promise<boolean> {
  const n = normalizeName(username);
  if (!n) return true;
  const claimed = await isNameClaimed(n);
  if (!claimed) return true;
  const creds = parseBasicAuth(req);
  if (!creds) {
    res.status(403).json({
      error: 'This name is claimed. You must log in as this user (name + password) to use it.',
    });
    return false;
  }
  const user = await verifyClaimedUser(creds.name, creds.password);
  if (!user || normalizeName(user.name).toLowerCase() !== n.toLowerCase()) {
    res.status(403).json({ error: 'This name is claimed by someone else. You cannot use it.' });
    return false;
  }
  return true;
}
