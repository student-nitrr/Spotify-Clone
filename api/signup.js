import { sql } from '@vercel/postgres';
import { databaseIsConfigured, ensureUsersTable, hashPassword, publicUser, sendError, validateCredentials } from './_auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendError(response, 405, 'Method not allowed.');
  if (!databaseIsConfigured()) return sendError(response, 503, 'Connect a Vercel Postgres or Neon database to this project, then redeploy.');
  const credentials = validateCredentials(request.body, true);
  if (!credentials) return sendError(response, 400, 'Use a name, valid email, and a password of at least 8 characters.');
  try {
    await ensureUsersTable();
    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${credentials.name}, ${credentials.email}, ${hashPassword(credentials.password)})
      RETURNING id, name, email
    `;
    return response.status(201).json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') return sendError(response, 409, 'An account with that email already exists.');
    console.error(error);
    return sendError(response, 503, 'The user database is not configured yet.');
  }
}