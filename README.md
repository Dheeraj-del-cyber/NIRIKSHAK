# NIRIKSHAK — AI-Powered Revenue Leakage Detection

Full-stack scaffold implementing the workflow from the "NIRIKSHAK" pitch deck
(Team ASTRA): invoice ↔ GSTR-2B reconciliation with a validation layer, an
adaptive mismatch-detection engine, a feedback loop, and dual-format
reporting (human JSON + machine XML).

## Stack (matches slide 5 of the deck)

- **Frontend:** React (Vite) + Material UI + Recharts
- **Backend:** Node.js + Express
- **Database:** MongoDB (via Mongoose)
- **Data format:** XML (machine output) + JSON (human report)

## What's implemented vs. simplified

This is a working prototype, not a production system. A few things are
intentionally simplified — see **Known gaps** below before treating this as
demo-ready for a real business:

| Slide claim | This implementation |
|---|---|
| "Direct, automated fetch... from the GST portal" | GSTR-2B data is uploaded as CSV (real GSTR-2B ingestion needs a licensed GSP/API integration and OAuth with the GST portal — out of scope for a prototype) |
| "Adaptive AI Model... learns recurring error patterns" | A transparent rule-based reconciliation engine whose per-mismatch-type risk weights are adjusted by user feedback (Confirm / False Positive) — this is genuinely adaptive, but it is not a trained ML classifier. Swapping in `services/adaptiveAI.js`'s scoring for a real model (e.g. an anomaly-detection classifier trained on `PatternWeight` history) is the natural next step and matches the "Scikit-learn / TensorFlow" line in the deck |
| "Data Validation: Python, Pandas, NumPy" | Implemented in Node.js (`services/validation.js`) to keep one runtime for the prototype. If you want the Python/Pandas layer specifically, it can run as a small separate microservice the backend calls before insert — ask and I can add it |
| Dual-format output | Fully implemented: `GET /api/analysis/report/json` and `GET /api/analysis/report/xml` |

## Project structure

```
nirikshak/
  backend/
    server.js              # Express app entry point
    models/                 # Invoice, GSTRecord, Mismatch, PatternWeight
    routes/                 # invoices, gst, analysis
    services/
      validation.js         # GSTIN/format/math validation layer
      parseCsv.js
      adaptiveAI.js          # reconciliation engine + feedback-driven weights
      report.js              # JSON + XML report builders
    seed/sampleData.js       # demo data with intentional mismatches
  frontend/
    src/
      App.jsx
      components/            # UploadPanel, Dashboard, RiskChart, MismatchTable, SummaryCards
      api/client.js
  sample-data/                # CSVs you can upload through the UI to test manually
```

## Setup

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (or a connection string to Atlas/hosted Mongo)

### 2. Backend

```bash
cd backend
cp .env.example .env    # edit MONGO_URI if not using local default
npm install
npm run seed             # optional: loads demo invoices + GSTR-2B data with built-in mismatches
npm run dev               # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5173, proxies /api to :5000
```

Open http://localhost:5173. If you ran `npm run seed`, click **Run Analysis**
immediately to see flagged mismatches. Otherwise upload the CSVs in
`sample-data/` (or your own, same column layout) and then click **Run
Analysis**.

### 4. Try the feedback loop

Click the ✔ (confirm) or ✕ (false positive) icon on a flagged row. That
mismatch type's weight in `PatternWeight` shifts, so its risk score on future
runs moves up or down — the "Continuous Feedback Loop" from the deck.

## API summary

| Method & path | Purpose |
|---|---|
| `POST /api/invoices/upload` | Upload billing-system invoices (CSV file or JSON `{rows:[...]}`) |
| `POST /api/gst/upload` | Upload GSTR-2B records |
| `POST /api/analysis/run` | Run reconciliation, regenerate open mismatches |
| `GET /api/analysis/mismatches` | List mismatches (`?status=`, `?type=`) |
| `POST /api/analysis/mismatches/:id/feedback` | `{ outcome: "confirmed" \| "false_positive" }` |
| `GET /api/analysis/summary` | Dashboard summary (counts, ITC at risk, chart data) |
| `GET /api/analysis/report/json` | Human-readable report |
| `GET /api/analysis/report/xml` | Machine-format report |

## Known gaps to close before real use

These are exactly the kind of things worth flagging before calling this
"complete" — think of this as the design-review list for this build:

1. **No auth.** Every endpoint is open. A real deployment needs per-business
   auth and multi-tenant data isolation (right now all invoices/GST records
   share one collection with no `businessId` field).
2. **No real GST portal integration.** CSV upload stands in for the GSP API
   call described in the deck.
3. **Reconciliation is O(n) in memory per run**, fine for a prototype/hackathon
   dataset, but for large filing volumes it should be moved to a paginated or
   streaming/aggregation-pipeline approach in MongoDB.
4. **Tolerance thresholds are global** (`AMOUNT_TOLERANCE`, `AMOUNT_TOLERANCE_PCT`
   in `.env`) rather than configurable per business or per tax slab.
5. **No period-close/versioning logic** — re-uploading a period's data doesn't
   version old records, it just adds more rows, so duplicate detection could
   misfire across repeated uploads of the same file. Add an idempotency key
   (e.g. hash of the row) before production use.
6. **"Adaptive AI" is rule-based + weighted, not a trained model.** That's a
   deliberate, explainable choice for a compliance tool, but if the deck's
   "Adaptive AI Model" claim needs to literally be a Scikit-learn/TensorFlow
   model, that swap happens in `services/adaptiveAI.js`.
