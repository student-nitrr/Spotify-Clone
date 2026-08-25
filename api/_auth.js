import { sql } from '@vercel/postgres';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export async function ensureUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function passwordMatches(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(':');
  if (!salt || !storedHash) return false;
  const hash = scryptSync(password, salt, 64);
  return timingSafeEqual(hash, Buffer.from(storedHash, 'hex'));
}

export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

export function sendError(response, status, message) {
  response.status(status).json({ error: message });
}

export function validateCredentials(body, requireName = false) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name = String(body.name || '').trim();
  if (!email.includes('@') || password.length < 8 || (requireName && !name)) return null;
  return { email, password, name };
}