<div align="center">

# 🔍 NIRIKSHAK

### AI-Powered Revenue Leakage Detection

**Full-stack prototype implementing invoice ↔ GSTR-2B reconciliation with adaptive mismatch detection, feedback-driven learning, and dual-format reporting.**

Built by **Team ASTRA**

---

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Material UI](https://img.shields.io/badge/Material_UI-5-007FFF?style=flat-square&logo=mui&logoColor=white)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🧾 GST Reconciliation
- Upload invoices & GSTR-2B records (CSV / JSON)
- Intelligent mismatch detection with risk scoring
- Confirm / False Positive feedback loop
- Adaptive weights that learn from corrections

</td>
<td width="50%" valign="top">

### 📊 Revenue Risk Analysis
- Detect unusual discounts & refunds
- Flag overdue payments & failed renewals
- Predict customer churn risk (explainable scoring)
- Revenue-risk scoring (0–100) with recovery estimates

</td>
</tr>
</table>

<br>

| Capability | Status |
|---|---|
| 📤 CSV / JSON upload for invoices & GSTR-2B | ✅ Implemented |
| 🔄 Adaptive reconciliation engine with feedback | ✅ Implemented |
| 📋 Dual-format reports (JSON + XML) | ✅ Implemented |
| 💰 Revenue leakage & churn prediction module | ✅ Implemented |
| 🔐 Authentication & multi-tenant isolation | ❌ Not yet |
| 🌐 Live GST portal integration | ❌ Not yet |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **MongoDB** running locally (or a connection string to Atlas)

### 1. Backend

```bash
cd backend
cp .env.example .env       # edit MONGO_URI if needed
npm install
npm run seed                # optional: loads demo data with built-in mismatches
npm run dev                 # → http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # → http://localhost:5173 (proxies /api to :5000)
```

### 3. Try it out

Open **http://localhost:5173**

> If you ran `npm run seed`, click **Run Analysis** immediately to see flagged mismatches.
> Otherwise, upload the CSVs in `sample-data/` and then click **Run Analysis**.

### 4. Test the feedback loop

Click the **✔** (confirm) or **✕** (false positive) icon on a flagged row. That mismatch type's weight shifts — its risk score on future runs moves up or down. This is the **Continuous Feedback Loop** in action.

---

## 🏗️ Architecture

```
nirikshak/
├── backend/
│   ├── server.js                 # Express entry point
│   ├── models/                   # Invoice, GSTRecord, Mismatch, PatternWeight, …
│   ├── routes/                   # invoices, gst, analysis, revenue
│   ├── services/
│   │   ├── validation.js         # GSTIN / format / math validation
│   │   ├── parseCsv.js           # CSV parser
│   │   ├── adaptiveAI.js         # Reconciliation engine + feedback-driven weights
│   │   ├── revenueRisk.js        # Revenue leakage & churn scoring
│   │   └── report.js             # JSON + XML report builders
│   └── seed/sampleData.js        # Demo data with intentional mismatches
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── components/           # UploadPanel, Dashboard, RiskChart, MismatchTable, …
│       └── api/client.js
│
└── sample-data/                  # Ready-to-upload CSVs for manual testing
    ├── transactions_sample.csv
    ├── payments_sample.csv
    └── customers_sample.csv
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/invoices/upload` | Upload billing-system invoices (CSV or JSON) |
| `POST` | `/api/gst/upload` | Upload GSTR-2B records |
| `POST` | `/api/analysis/run` | Run reconciliation & regenerate mismatches |
| `GET` | `/api/analysis/mismatches` | List mismatches (`?status=`, `?type=`) |
| `POST` | `/api/analysis/mismatches/:id/feedback` | Submit feedback: `confirmed` or `false_positive` |
| `GET` | `/api/analysis/summary` | Dashboard summary (counts, ITC at risk, charts) |
| `GET` | `/api/analysis/report/json` | Human-readable JSON report |
| `GET` | `/api/analysis/report/xml` | Machine-format XML report |
| `GET` | `/api/health` | Health check |

---

## ⚖️ What's Real vs. Simplified

| Deck Claim | Implementation |
|---|---|
| *"Direct, automated fetch from the GST portal"* | CSV upload (real GST API integration requires a licensed GSP + OAuth — out of scope for a prototype) |
| *"Adaptive AI Model… learns recurring error patterns"* | Rule-based engine with **feedback-adjusted risk weights** — genuinely adaptive, not a trained ML classifier. The natural next step is swapping in a real model in `adaptiveAI.js` |
| *"Data Validation: Python, Pandas, NumPy"* | Implemented in Node.js to keep a single runtime. A Python/Pandas microservice can be added if needed |
| Dual-format output | ✅ Fully implemented (`GET …/report/json` and `…/report/xml`) |

---

## ⚠️ Known Gaps

These are the design-review items before this moves beyond a prototype:

1. **No auth** — every endpoint is open; no per-business data isolation yet
2. **No real GST portal integration** — CSV upload stands in for the GSP API call
3. **In-memory reconciliation** — O(n) per run, fine for hackathon volumes but needs streaming/aggregation for production filing sizes
4. **Global tolerance thresholds** — `AMOUNT_TOLERANCE` / `AMOUNT_TOLERANCE_PCT` in `.env` apply to all businesses; should be configurable per tenant
5. **No period-close / versioning** — re-uploading a period's data adds rows instead of versioning; duplicate detection can misfire across repeated uploads
6. **Not a trained ML model** — the adaptive scoring is rule-based + weighted; swapping in a classifier (Scikit-learn / TensorFlow) is the planned next step

---

## 📄 License

This project is a prototype built for demonstration purposes.

---

<div align="center">

**Built with ❤️ by Team ASTRA**

</div>
