# Bare Bones Bankroll

A poker bankroll tracker built with React, Node.js/Express, and MongoDB. Available as a web app or native Windows desktop app via Electron.

## Features

- Log poker sessions (Online/Live, Cash/Tournament, NL/PLO) with buy-in, cash-out, and notes
- Built for sweepstakes sites like Club WPT Gold: track purchases (dollars paid vs chips received), redemptions (pending/completed/cancelled), and promos
- Session buy-ins and cash-outs are recorded in the ledger automatically by the server
- Bankroll statistics, reports, and session history with CSV export/import
- JWT-based authentication with password reset via email
- Admin dashboard for support ticket management
- Native Windows desktop app with auto-updates

## Tech Stack

| Layer    | Stack                                              |
| -------- | -------------------------------------------------- |
| Frontend | React 18, React Router 6, Vite, Axios              |
| Backend  | Node.js, Express 4, MongoDB (Mongoose), SendGrid   |
| Desktop  | Electron 41, electron-builder (NSIS installer)     |
| Testing  | Vitest + React Testing Library (client), Jest (server) |

## Prerequisites

- Node.js
- MongoDB instance (local or Atlas)
- SendGrid account (for password reset emails)

## Environment Variables

**Server** — `server/config/.env`

```
PORT=5000
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@example.com
NODE_ENV=development
ADMIN_EMAIL=admin@example.com
CLIENT_URL=http://localhost:5173
# Optional: set when running behind a reverse proxy (e.g. 1) so rate limits see client IPs
TRUST_PROXY=
```

**Client** — no environment file is needed. The client always calls `/api`; in development Vite proxies it to the server on port 5004 (override with `API_PORT`).

**Desktop app** — packaged builds never include `server/config/.env`. Put the same keys in `%APPDATA%\Bare Bones Bankroll\config.env`; the app shows the exact path on first launch if the file is missing.

## Installation

```bash
# Root (Electron dependencies)
npm install

# Client
cd client && npm install

# Server
cd server && npm install
```

## Development

**Web (separate terminals)**

```bash
# Terminal 1 — backend (nodemon)
cd server && npm run dev

# Terminal 2 — frontend (Vite, proxies /api to localhost:5000)
cd client && npm run dev
```

**Electron (integrated)**

```bash
npm run electron:dev
```

## Building

**Web / server deployment**

```bash
cd server && npm run build   # installs deps + builds client
npm start                    # start production server
```

**Windows desktop app**

```bash
npm run electron:build       # builds client + creates NSIS installer
```

## Scripts

| Command                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `npm run electron:dev`     | Build client + launch Electron (DevTools open) |
| `npm run electron:build`   | Build client + create Windows installer  |
| `cd server && npm run dev` | Start backend with hot reload            |
| `cd client && npm run dev` | Start Vite dev server                    |
| `cd client && npm run build` | Build optimized React bundle           |

## Project Structure

```
bare-bones-bankroll/
├── client/              # React frontend
│   └── src/
│       ├── pages/       # Dashboard, SignIn, NewSession, etc.
│       ├── components/  # Reusable UI components
│       ├── context/     # UserContext, BankrollContext
│       ├── hooks/       # Custom hooks
│       └── utils/       # Bankroll, stats, CSV and date helpers
├── server/              # Express backend
│   ├── models/          # Mongoose schemas (User, Session, Transaction, Message)
│   ├── controllers/     # Route handlers
│   ├── routes/          # API endpoint definitions
│   └── middleware/      # Auth, validation, error handling
└── electron/            # Electron main process
    ├── main.js          # Loads config, starts the local server, creates the window
    └── preload.js       # Exposes a minimal window.electronAPI to the renderer
```

## Electron Auto-Updates

Updates are delivered via **GitHub Releases** using `electron-updater`. The flow is:

1. **Build and publish a release**

   ```bash
   npm run electron:build
   ```

   This builds the client, packages the app with electron-builder, and produces an NSIS installer in `dist-electron/`. Publish the output artifacts (installer + `latest.yml`) as a new GitHub Release on the `STJOHNL/bare-bones-bankroll` repository.

2. **User receives the update automatically**

   When the packaged app starts, `autoUpdater.checkForUpdates()` runs and checks GitHub Releases for a newer version.

   - If an update is found, a dialog notifies the user that the new version is **downloading in the background**.
   - Once the download completes, a second dialog prompts the user to **Restart Now** or **Later**.
   - Choosing "Restart Now" calls `autoUpdater.quitAndInstall()`, which applies the update and relaunches the app.

3. **Development builds are excluded**

   Auto-update only runs in packaged builds (`app.isPackaged === true`). It is silently skipped during `npm run electron:dev`.

**Release checklist:**
- Bump `version` in the root `package.json` (and `client/package.json`) before building
- Commit, then tag the commit `vX.Y.Z` and push the tag
- Run `npm run electron:build`
- Create a GitHub Release for the tag and attach `Bare-Bones-Bankroll-Setup-X.Y.Z.exe`, its `.blockmap`, and `latest.yml` from `dist-electron/` without renaming them (`latest.yml` refers to the exact file names)
- Mark the release as **latest** so `electron-updater` picks it up
- Each machine needs `%APPDATA%\Bare Bones Bankroll\config.env` — the installer never contains secrets

## Data Migration (v1.12)

Version 1.12 renames Deposit/Withdrawal to Purchase/Redemption and adds indexes. Older data still displays correctly, but run the migration once against your database:

```bash
cd server
npm run migrate:gold            # dry run — shows what would change
npm run migrate:gold -- --apply # writes the changes
```

## API Routes

| Prefix          | Description                          |
| --------------- | ------------------------------------ |
| `/api/auth`     | Sign-in, sign-up, sign-out, current user (`/me`), password reset |
| `/api/user`     | Profile management                   |
| `/api/session`  | CRUD poker sessions                  |
| `/api/transaction` | Purchases, redemptions, promos (buy-ins/cash-outs are managed by sessions) |
| `/api/support`  | Submit and view support tickets      |
| `/api/player-notes` | Notes on opponents               |
