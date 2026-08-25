import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataDirectory = join(root, 'data');
if (!existsSync(dataDirectory)) mkdirSync(dataDirectory);
const database = new DatabaseSync(join(dataDirectory, 'users.db'));
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const passwordMatches = (password, storedPassword) => {
  const [salt, storedHash] = storedPassword.split(':');
  if (!salt || !storedHash) return false;
  const hash = scryptSync(password, salt, 64);
  return timingSafeEqual(hash, Buffer.from(storedHash, 'hex'));
};

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });
const sendJson = (response, status, body) => {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
};

const handleAuth = async (request, response, action) => {
  let body;
  try {
    body = JSON.parse(await new Promise((resolve, reject) => {
      let data = '';
      request.on('data', (chunk) => { data += chunk; });
      request.on('end', () => resolve(data));
      request.on('error', reject);
    }));
  } catch {
    sendJson(response, 400, { error: 'Please send valid account details.' });
    return;
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email.includes('@') || password.length < 8) {
    sendJson(response, 400, { error: 'Use a valid email and a password of at least 8 characters.' });
    return;
  }

  if (action === 'signup') {
    const name = String(body.name || '').trim();
    if (!name) {
      sendJson(response, 400, { error: 'Please enter your name.' });
      return;
    }
    try {
      const result = database.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hashPassword(password));
      sendJson(response, 201, { user: { id: Number(result.lastInsertRowid), name, email } });
    } catch (error) {
      sendJson(response, error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 409 : 500, { error: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'An account with that email already exists.' : 'Unable to create your account.' });
    }
    return;
  }

  const user = database.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email);
  if (!user || !passwordMatches(password, user.password_hash)) {
    sendJson(response, 401, { error: 'Email or password is incorrect.' });
    return;
  }
  sendJson(response, 200, { user: publicUser(user) });
};

const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === 'POST' && (url.pathname === '/api/login' || url.pathname === '/api/signup')) {
    await handleAuth(request, response, url.pathname.slice(5));
    return;
  }
  if (request.method !== 'GET') { response.writeHead(405); response.end(); return; }

  const requestedPath = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const filePath = normalize(join(root, requestedPath));
  if (!filePath.startsWith(root) || !existsSync(filePath)) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
  response.end(readFileSync(filePath));
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Spotify Clone running at http://localhost:${port}`));
