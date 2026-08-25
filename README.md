# Spotify Clone

A Spotify-style player with a Node.js authentication API and SQLite user database.

## Run locally

Requires Node.js 22.5 or newer.

```bash
npm start
```

Open `http://localhost:3000`. Locally, new accounts are stored in `data/users.db`; passwords are salted and hashed before storage.

## Vercel deployment

Create a Vercel Postgres/Neon integration for the project and connect it to the deployment. In Vercel, open **Project Settings > Integrations**, add a Postgres provider, and make sure it is connected to the `main` deployment environment. Vercel must provide the `POSTGRES_URL` environment variable. Redeploy after connecting it. The `api` routes create the `users` table automatically on the first signup or login request.
