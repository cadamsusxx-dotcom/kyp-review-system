/**
 * KYP Clinical Review — Backend Server
 * Node.js + Express + JSON file (no native compilation needed)
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── JSON DATABASE ─────────────────────────────────────────────────────────────
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'reviews.json');

function readDB() {
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch(e) {}
  return { reviews: [] };
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── API ROUTES ────────────────────────────────────────────────────────────────

app.post('/api/reviews', (req, res) => {
  const { date, name, cred, inst, spec, years, avg, domScores, flags, recommend, strengths, concerns, overall } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Reviewer name is required.' });
  const db = readDB();
  const review = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    date, name: name.trim(), cred, inst, spec, years,
    avg: avg || 0,
    domScores: domScores || {},
    flags: flags || [],
    recommend: recommend || '',
    strengths: strengths || '',
    concerns: concerns || '',
    overall: overall || ''
  };
  db.reviews.push(review);
  writeDB(db);
  res.status(201).json({ id: review.id, message: 'Review saved.' });
});

app.get('/api/reviews', (req, res) => {
  const db = readDB();
  res.json([...db.reviews].reverse());
});

app.get('/api/reviews/:id', (req, res) => {
  const db = readDB();
  const r = db.reviews.find(x => x.id === parseInt(req.params.id));
  if (!r) return res.status(404).json({ error: 'Review not found.' });
  res.json(r);
});

app.delete('/api/reviews/:id', (req, res) => {
  const db = readDB();
  const len = db.reviews.length;
  db.reviews = db.reviews.filter(x => x.id !== parseInt(req.params.id));
  if (db.reviews.length === len) return res.status(404).json({ error: 'Review not found.' });
  writeDB(db);
  res.json({ message: 'Review deleted.' });
});

app.get('/api/stats', (req, res) => {
  const db = readDB();
  const avg = db.reviews.length ? Math.round(db.reviews.reduce((s,r)=>s+r.avg,0)/db.reviews.length) : null;
  res.json({ total: db.reviews.length, composite_avg: avg });
});

app.get('/survey',    (_, res) => res.sendFile(path.join(__dirname, 'public', 'survey.html')));
app.get('/dashboard', (_, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/',          (_, res) => res.sendFile(path.join(__dirname, 'public', 'survey.html')));

app.listen(PORT, () => {
  console.log(`KYP Review Server running on http://localhost:${PORT}`);
  console.log(`  Survey:    http://localhost:${PORT}/survey`);
  console.log(`  Dashboard: http://localhost:${PORT}/dashboard`);
});
