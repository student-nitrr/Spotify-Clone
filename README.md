# Spotify Clone

A Spotify-style player with a Node.js authentication API and SQLite user database.

## Run locally

Requires Node.js 22.5 or newer.

```bash
npm start
```

Open `http://localhost:3000`. New accounts are stored in `data/users.db`; passwords are salted and hashed before storage.
