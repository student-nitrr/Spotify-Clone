import { sql } from '@vercel/postgres';
import { databaseIsConfigured, ensureUsersTable, passwordMatches, publicUser, sendError, validateCredentials } from './_auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendError(response, 405, 'Method not allowed.');
  if (!databaseIsConfigured()) return sendError(response, 503, 'Connect a Vercel Postgres or Neon database to this project, then redeploy.');
  const credentials = validateCredentials(request.body);
  if (!credentials) return sendError(response, 400, 'Use a valid email and a password of at least 8 characters.');
  try {
    await ensureUsersTable();
    const result = await sql`SELECT id, name, email, password_hash FROM users WHERE email = ${credentials.email}`;
    const user = result.rows[0];
    if (!user || !passwordMatches(credentials.password, user.password_hash)) return sendError(response, 401, 'Email or password is incorrect.');
    return response.status(200).json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    return sendError(response, 503, 'The user database is not configured yet.');
  }
}