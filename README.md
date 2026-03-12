# Bare Bones Bankroll

A poker bankroll tracker built with React, Node.js/Express, and MongoDB. Available as a web app or native Windows desktop app via Electron.

## Features

- Log poker sessions (Online/Live, Cash/Tournament, NL/PLO) with buy-in, cash-out, and notes
- Track transactions: deposits, withdrawals, buy-ins, cash-outs, and promo bonuses
- Bankroll statistics and session history
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
```

**Client** — `client/.env`

```
VITE_BASE_URL=http://localhost:5000/api
VITE_ASSETS_URL=http://localhost:5000
```

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
│       └── utils/       # API clients and utilities
├── server/              # Express backend
│   ├── models/          # Mongoose schemas (User, Session, Transaction, Message)
│   ├── controllers/     # Route handlers
│   ├── routes/          # API endpoint definitions
│   └── middleware/      # Auth, validation, error handling
└── electron/            # Electron main process
    ├── main.js          # Starts server, creates window, manages JWT storage
    └── preload.js       # Exposes window.electronAPI to renderer
```

## Electron Auto-Updates

Updates are delivered via **GitHub Releases** using `electron-updater`. The flow is:

1. **Build and publish a release**

   ```bash
   npm run electron:build
   ```

   This builds the client, packages the app with electron-builder, and produces an NSIS installer in `dist-electron/`. Publish the output artifacts (installer + `latest.yml`) as a new GitHub Release on the `STJOHNL/bare-bones-bankroll` repository.

2. **User receives the update automatically**

   When the packaged app starts, `autoUpdater.checkForUpdatesAndNotify()` runs and checks GitHub Releases for a newer version.

   - If an update is found, a dialog notifies the user that the new version is **downloading in the background**.
   - Once the download completes, a second dialog prompts the user to **Restart Now** or **Later**.
   - Choosing "Restart Now" calls `autoUpdater.quitAndInstall()`, which applies the update and relaunches the app.

3. **Development builds are excluded**

   Auto-update only runs in packaged builds (`app.isPackaged === true`). It is silently skipped during `npm run electron:dev`.

**Release checklist:**
- Bump `version` in the root `package.json` before building
- Attach the installer (`.exe`) and `latest.yml` from `dist-electron/` to the GitHub Release
- Mark the release as **latest** so `electron-updater` picks it up

## API Routes

| Prefix          | Description                          |
| --------------- | ------------------------------------ |
| `/api/auth`     | Sign-in, sign-up, sign-out, password reset |
| `/api/user`     | Profile management                   |
| `/api/session`  | CRUD poker sessions                  |
| `/api/transaction` | Deposits, withdrawals, buy-ins, cash-outs |
| `/api/support`  | Submit and view support tickets      |
