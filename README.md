# Snapnotes

A compact poker player notes app. Designed to be narrow (~400px wide) and used alongside poker tables. Track players with notes, hand histories, exploits, and star/spicy ratings. Share hands for review with optional private initial thoughts and reviewer comments.

## Tech stack

- **Frontend:** React 19, Vite, TypeScript (SWC), MUI (Material UI) dark theme
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB (e.g. MongoDB Atlas)

## Prerequisites

- Node.js (v18+)
- MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

## Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/aaronpope007/snapnotes.git
   cd snapnotes
   npm install
   cd server && npm install && cd ..
   ```

2. **Environment**

   Copy the server env example and set your MongoDB URI:

   ```bash
   cp server/.env.example server/.env
   ```

   Edit `server/.env`:

   - `MONGODB_URI` — your MongoDB connection string
   - `PORT` — optional, defaults to 5000

3. **Run**

   ```bash
   npm run dev
   ```

   This starts the Vite dev server (frontend) and the Express server (API). The app is served by Vite; API requests are proxied from `/api` to the backend.

4. **Open**

   In the browser, set your display name when prompted, then use the app at the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Run frontend + backend (dev)   |
| `npm run build`   | TypeScript build + Vite build  |
| `npm run preview` | Preview production build      |
| `npm run lint`    | Run ESLint                    |
| `npm run test`    | Run Vitest tests              |
| `npm run test:watch` | Run Vitest in watch mode   |

## Project structure

```
snapnotes/
├── src/                 # Frontend (React)
│   ├── api/             # API client (axios)
│   ├── components/     # UI components
│   ├── constants/       # Player types, stakes, ratings, etc.
│   ├── context/         # UserNameContext
│   ├── hooks/           # useHandsToReview, useHandHistoryPanel, useConfirm
│   ├── utils/           # cardParser, handReviewUtils
│   └── types/           # Shared TypeScript types
├── server/              # Backend (Express)
│   ├── models/          # Mongoose models (Player, HandToReview)
│   ├── routes/          # API routes (players, handsToReview)
│   └── .env             # MONGODB_URI, PORT (not committed)
├── shared/              # Shared constants (e.g. default hand title)
└── package.json
```

## Features

- **Players:** Add, edit, delete players. Assign player type (e.g. Whale, Nit, TAG), stakes, notes, exploits.
- **Hand histories (per player):** Attach hand history entries with optional spoiler blocks and comments (add/edit/delete, expand/collapse).
- **Hands to review:** Add hands for review; optional initial comment (can be marked private so reviewers don’t see it). Reviewers can rate (stars + spicy), comment, and optionally reveal the author’s initial thoughts after reviewing. Archive/open filter and sort by rating.
- **Import:** Import players from Word documents (mammoth).
- **UI:** Dark theme, narrow layout, card picker for hand text, rich note rendering with `**` highlight.

## Configuration

- **User name:** Set in the app (stored in browser); used for “added by” on comments and ratings.
- **Bet sizes:** The hand history card picker’s bet-size buttons (B25, B50, …) are configurable and stored in `localStorage`.

## Notes

- No authentication; the app is intended for local or single-user use. Anyone with the URL and network access can use the same data if the server is exposed.
- All env and secrets belong in `server/.env`; never commit real credentials.
