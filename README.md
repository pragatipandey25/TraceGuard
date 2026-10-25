# 🛡️ TraceGuard

> **Web Security Assessment & Remediation Platform**  
> An automated, passive web security auditor for developers and development teams to inspect security headers, SSL/TLS certificates, cookies, CORS, and information disclosures on applications they own.

---

## ⚡ What is TraceGuard?

TraceGuard scans public web applications you own or have permission to audit, finds security misconfigurations, explains the practical risks in plain English, and provides copy-paste remediation code to fix them.

- **Real, Bounded Scans**: Performs real, non-destructive HTTP/HTTPS checks. No fabricated scan results.
- **100% Free & Usable Offline**: No paid API key required. Comes with a built-in expert security knowledge base.
- **Strict Anti-SSRF Defense**: Automatically blocks localhost (`127.0.0.1`), private networks (`192.168.x`, `10.x`), and cloud metadata (`169.254.169.254`).
- **Remediation Tracking**: Organize issues into `Open`, `In Progress`, `Fixed`, and `Accepted Risk`.
- **One-Click Reports**: Download executive PDF reports and machine-readable JSON files.

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- **Node.js** v18+ (tested on v22)
- **MongoDB** running locally or via MongoDB Atlas

---

### 2. Configure Environment

In the `server/` directory, create or check your `.env` file:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/traceguard
JWT_SECRET=super_secret_traceguard_jwt_key_development_must_be_long_and_random_32chars
JWT_EXPIRES_IN=1d
SCAN_TIMEOUT_MS=15000
MAX_CONCURRENT_SCANS=2
MAX_SCANS_PER_HOUR=20

# Optional: Add Google Gemini or OpenAI key for dynamic AI explanations
# (Leave blank to use the built-in 100% offline security knowledge base)
AI_API_KEY=
```

---

### 3. Start the Platform

Open two terminal windows:

#### Terminal 1 — Backend:
```bash
npm run server
```
*Backend runs on `http://localhost:5000`*

#### Terminal 2 — Frontend:
```bash
npm run client
```
*Frontend runs on `http://localhost:5173`*

Open **`http://localhost:5173`** in your browser!

---

## 🧭 How to Use TraceGuard

```
Register / Login  ──>  Add Target URL  ──>  Launch Assessment  ──>  Inspect & Remediate  ──>  Download PDF
```

### 1. Create an Account
- Navigate to the register page and create an auditor account.
- Sign in with your email and password.

### 2. Add an Authorized Target
- Go to **New Assessment** or **Settings**.
- Enter your application's public URL (e.g., `https://myapp.com`) and select the environment (`Production`, `Staging`, `Development`).
- Check the mandatory **Authorization Confirmation** certifying you own or have permission to audit the target.

### 3. Launch the Assessment
- Click **"Launch Assessment"**.
- Watch the live progress bar (0% to 100%) as TraceGuard checks headers, certificates, cookies, and redirection.

### 4. Review Findings & Fix Issues
- Each finding includes:
  - **Severity**: Critical, High, Medium, Low, or Informational
  - **Observed Evidence**: The exact response headers or certificates received
  - **Why It Matters**: Practical risk explanation
  - **Copy-Paste Fix**: Ready-to-use snippets for Nginx, Apache, or Express

### 5. Track Remediation
- Use the **Remediation Workspace** (Kanban board) to move issues from `Open` to `In Progress` or `Fixed`.
- Mark non-applicable findings as `Accepted Risk` with an audit justification.

### 6. Export Reports
- Go to **Reports** to download an executive **PDF report** or **JSON export** with posture scores, metrics, and remediation checklists.

---

## 🤖 Optional: Adding an AI API Key

TraceGuard works **100% offline out-of-the-box** using its built-in expert knowledge base. 

If you want dynamic explanations powered by Google Gemini or OpenAI:

1. Open `server/.env`.
2. Set your key on line `AI_API_KEY=`:
   - **Google Gemini** (starts with `AQ.` or `AIza...`):
     ```env
     AI_API_KEY=your-gemini-key-here
     ```
   - **OpenAI** (starts with `sk-...`):
     ```env
     AI_API_KEY=your-openai-key-here
     ```
3. Restart the backend server (`npm run server`).
4. In the app, go to **Settings** (`/app/settings`) and click **"Test AI Connection"** to verify your key.

---

## 🔍 What TraceGuard Audits

| Module | What It Checks | Why It Matters |
|---|---|---|
| **Security Headers** | Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options, Referrer-Policy, Clickjacking defense (`frame-ancestors` / `X-Frame-Options`) | Prevents Cross-Site Scripting (XSS), SSL-stripping, clickjacking, and MIME sniffing attacks. |
| **TLS / SSL** | Certificate expiration, hostname matching, SANs, deprecated TLS 1.0/1.1 | Ensures connections are encrypted, trusted, and certificates are renewed before expiry. |
| **Cookie Security** | `Secure`, `HttpOnly`, `SameSite` (Lax/Strict), domain scoping | Protects session tokens from cross-site theft (XSS/CSRF) and transmission over unencrypted HTTP. |
| **CORS Policy** | Wildcard `*` origins, reflected `Origin`, `Access-Control-Allow-Credentials` | Prevents malicious cross-origin websites from reading private user data. |
| **HTTPS Redirection** | HTTP to HTTPS automatic upgrade, protocol downgrade detection | Guarantees cleartext visitors are securely redirected to encrypted HTTPS without downgrade hops. |
| **Information Leaks** | `Server` version banners, `X-Powered-By` framework leaks, `robots.txt` paths, `security.txt` | Reduces reconnaissance data available to attackers and verifies coordinated disclosure policies. |

---

## 🛡️ Anti-SSRF Safeguards

To prevent abuse, TraceGuard strictly forbids scans against internal networks:
- **Blocked IP Ranges**: Loopback (`127.0.0.1`), Private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Cloud metadata (`169.254.169.254`), and IPv6 loopback (`::1`).
- **Allowed Ports**: Only standard web ports (`80`, `443`, `8080`, `8443`).
- **Redirect Re-Validation**: Verifies destination IPs on **every single redirect hop** (up to 5 hops) to prevent open-redirect SSRF bypasses.
- **Bounded Requests**: Strict 512KB response body limit and 15-second timeout prevent Denial of Service.

---

## 🧪 Running Automated Tests

Run the full test suite (both backend and frontend):
```bash
npm run test
```

Or run them individually:
```bash
# Run 13 backend security & SSRF tests:
npm run test:server

# Run frontend UI tests:
npm run test:client
```

---

## 📁 Project Structure

```
trace-guard/
├── client/                     # Frontend (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Badges, ScoreDial, AppShell layout
│   │   ├── context/            # AuthContext, ThemeContext (Dark/Light)
│   │   ├── pages/              # Overview, NewAssessment, History, Compare, Findings, Remediation, Reports, Settings
│   │   └── services/           # Axios API client
│   └── package.json
│
├── server/                     # Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/             # Environment validation, MongoDB connection
│   │   ├── controllers/        # Auth, Target, Assessment, Finding, Report, Dashboard
│   │   ├── middleware/         # Auth, RateLimiters, Validation, ErrorHandler
│   │   ├── models/             # User, Target, Assessment, Finding (Mongoose schemas)
│   │   ├── routes/             # REST API routes
│   │   ├── services/scanner/   # Modular Assessment Engine
│   │   │   ├── targetValidator.js       # Strict SSRF & CIDR validator
│   │   │   ├── safeHttpClient.js        # Bounded HTTP client with redirect validation
│   │   │   ├── scanOrchestrator.js      # Concurrency & lifecycle manager
│   │   │   └── checks/                  # Headers, TLS, Cookies, CORS, Redirects, Disclosures
│   │   └── utils/
│   │       ├── aiExplainer.js           # Built-in knowledge base & AI provider integration
│   │       └── pdfGenerator.js          # Executive PDF generator (PDFKit)
│   └── package.json
└── README.md
```

---

## ⚖️ Legal & Responsible Use Disclaimer

TraceGuard is engineered strictly for assessing applications you own or have explicit, verified authorization to audit. TraceGuard's security score is an internal heuristic based on observable configuration data and **does not guarantee that an application is invulnerable**. Automated checks should complement, not replace, periodic comprehensive penetration testing and secure code review.
