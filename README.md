# KYP Clinical Review System

Two-URL web application for collecting and analyzing clinical reviews of the KnowYourPerson app.

## Files

```
kyp-review-system/
├── server.js              ← Node.js backend (Express + SQLite)
├── package.json
├── reviews.db             ← auto-created on first run
└── public/
    ├── survey.html        ← reviewer-facing questionnaire  →  /survey
    └── dashboard.html     ← manager analytics dashboard    →  /dashboard
```

## Quick Start (local)

```bash
cd kyp-review-system
npm install
node server.js
```

Then open:
- **Survey:**    http://localhost:3000/survey
- **Dashboard:** http://localhost:3000/dashboard

Manager credentials: `manager` / `kyp2024`  
*(Change these in `dashboard.html` line 4 and in production use env vars + real auth)*

---

## Deploy to Render (free tier, recommended)

1. Push this folder to a GitHub repo
2. Go to https://render.com → New → Web Service → connect your repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variable: `PORT=10000`
6. Deploy — you get a URL like `https://kyp-reviews.onrender.com`

**Survey URL to share with reviewers:**  
`https://your-app.onrender.com/survey`

**Manager dashboard:**  
`https://your-app.onrender.com/dashboard`

> Note: Render free tier spins down after inactivity. For production use the $7/mo paid tier or Railway.

---

## Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## Deploy to a VPS (nginx + PM2)

```bash
# On server
npm install -g pm2
pm2 start server.js --name kyp-reviews
pm2 save

# nginx config snippet
location /survey    { proxy_pass http://localhost:3000/survey; }
location /dashboard { proxy_pass http://localhost:3000/dashboard; }
location /api       { proxy_pass http://localhost:3000/api; }
```

---

## Connecting the HTML files to your deployed server

In both `survey.html` and `dashboard.html`, find this line near the top of the `<script>` block:

```js
const API_BASE = '';  // set to your server URL e.g. 'https://kyp-reviews.onrender.com'
```

Change it to your deployed URL. If you serve both files from the same server (recommended), leave it as `''` — the relative path just works.

---

## Changing manager credentials

In `dashboard.html`:
```js
const MGMT_USER = 'manager', MGMT_PASS = 'kyp2024';
```

For production, move authentication to the server using a session token or HTTP Basic Auth header — never rely on client-side credential checks for sensitive data.

---

## Data

All reviews are stored in `reviews.db` (SQLite, single file). Back it up periodically:
```bash
cp reviews.db reviews_backup_$(date +%Y%m%d).db
```

Export all reviews as CSV from the Manager Dashboard → All Reviews → Export CSV.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/reviews | Submit a new review |
| GET | /api/reviews | List all reviews |
| GET | /api/reviews/:id | Get a single review |
| DELETE | /api/reviews/:id | Delete a review |
| GET | /api/stats | Aggregate stats |
