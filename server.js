/**
 * KYP Clinical Review — Backend Server
 * Node.js + Express + SQLite (zero external database dependency)
 *
 * Install:  npm install
 * Run:      node server.js
 * 
 * For production, run behind nginx or use a platform like Railway, Render, or Fly.io
 */

const express    = require('express');
const cors       = require('cors');
const Database   = require('better-sqlite3');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── DATABASE SETUP ────────────────────────────────────────────────────────────
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'reviews.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    date        TEXT,
    name        TEXT    NOT NULL,
    cred        TEXT,
    inst        TEXT,
    spec        TEXT,
    years       TEXT,
    avg_score   INTEGER,
    dom_scores  TEXT,   -- JSON
    flags       TEXT,   -- JSON array of flag indices
    recommend   TEXT,
    strengths   TEXT,
    concerns    TEXT,
    overall     TEXT
  )
`);

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*'   // lock down in production
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── API ROUTES ────────────────────────────────────────────────────────────────

// POST /api/reviews — submit a new review
app.post('/api/reviews', (req, res) => {
  const {
    date, name, cred, inst, spec, years,
    avg, domScores, flags, recommend,
    strengths, concerns, overall
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Reviewer name is required.' });
  }

  const stmt = db.prepare(`
    INSERT INTO reviews
      (date, name, cred, inst, spec, years, avg_score, dom_scores, flags, recommend, strengths, concerns, overall)
    VALUES
      (@date, @name, @cred, @inst, @spec, @years, @avg, @domScores, @flags, @recommend, @strengths, @concerns, @overall)
  `);

  const result = stmt.run({
    date:       date        || null,
    name:       name.trim(),
    cred:       cred        || null,
    inst:       inst        || null,
    spec:       spec        || null,
    years:      years       || null,
    avg:        avg         || 0,
    domScores:  JSON.stringify(domScores  || {}),
    flags:      JSON.stringify(flags      || []),
    recommend:  recommend   || null,
    strengths:  strengths   || null,
    concerns:   concerns    || null,
    overall:    overall     || null,
  });

  res.status(201).json({ id: result.lastInsertRowid, message: 'Review saved.' });
});

// GET /api/reviews — fetch all reviews (manager only — protect in production)
app.get('/api/reviews', (req, res) => {
  const rows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  const reviews = rows.map(r => ({
    id:         r.id,
    created_at: r.created_at,
    date:       r.date,
    name:       r.name,
    cred:       r.cred,
    inst:       r.inst,
    spec:       r.spec,
    years:      r.years,
    avg:        r.avg_score,
    domScores:  JSON.parse(r.dom_scores || '{}'),
    flags:      JSON.parse(r.flags      || '[]'),
    recommend:  r.recommend,
    strengths:  r.strengths,
    concerns:   r.concerns,
    overall:    r.overall,
  }));
  res.json(reviews);
});

// GET /api/reviews/:id — single review
app.get('/api/reviews/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Review not found.' });
  res.json({
    ...row,
    domScores: JSON.parse(row.dom_scores || '{}'),
    flags:     JSON.parse(row.flags      || '[]'),
  });
});

// DELETE /api/reviews/:id — delete a review
app.delete('/api/reviews/:id', (req, res) => {
  const info = db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Review not found.' });
  res.json({ message: 'Review deleted.' });
});

// GET /api/stats — aggregate stats for quick checks
app.get('/api/stats', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as n FROM reviews').get().n;
  const avg   = db.prepare('SELECT AVG(avg_score) as a FROM reviews').get().a;
  res.json({ total: count, composite_avg: avg ? Math.round(avg) : null });
});

// Serve survey and dashboard at clean URLs
app.get('/survey',    (_, res) => res.sendFile(path.join(__dirname, 'public', 'survey.html')));
app.get('/dashboard', (_, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/',          (_, res) => res.sendFile(path.join(__dirname, 'public', 'survey.html')));

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nKYP Review Server running on http://localhost:${PORT}`);
  console.log(`  Survey:    http://localhost:${PORT}/survey`);
  console.log(`  Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`  API:       http://localhost:${PORT}/api/reviews\n`);
});
