# TraceGuard — Web Security Assessment & Remediation Platform

TraceGuard is a production-minded web application security posture assessment and remediation platform built with the MERN stack (MongoDB, Express, React, Node.js). It empowers developers, application owners, and security engineers to discover security misconfigurations on authorized web applications, understand observed evidence, prioritize remediation, and track posture trends over time.

---

## Key Highlights

- **Real, Bounded Security Scanner**: Performs passive, non-destructive HTTP/HTTPS checks. Never produces hardcoded or fabricated scan results.
- **SSRF Defense Architecture**: Multi-layered IP and DNS validation engine blocking loopbacks (`127.0.0.1`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local/cloud metadata (`169.254.169.254`), IPv6 loopbacks, and non-standard web ports. Revalidates IP addresses on every redirect hop.
- **100% Usable Offline**: No paid AI API key is required. Comprehensive built-in rule knowledge engine provides beginner-friendly explanations, impact statements, and copyable remediation configurations.
- **Assessment Lifecycle & Comparison**: Asynchronous scan orchestration supporting cancellation, progress tracking, and side-by-side diff comparisons of the same target across time (new regressions, resolved fixes, recurring issues).
- **Executive Reports**: Downloadable professional PDF reports (generated with `PDFKit`) and machine-readable JSON exports.
- **Remediation Kanban Workspace**: Tracks issues across `Open`, `In Progress`, `Fixed`, and `Accepted Risk` states with mandatory risk justifications and team audit notes.

---

## System Architecture

```
trace-guard/
├── client/                     # Vite + React 18 + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/         # Common UI, Badges, ScoreDial, AppShell
│   │   ├── context/            # AuthContext (JWT/Cookie), ThemeContext (Light/Dark)
│   │   ├── pages/              # Overview, NewScan, History, Compare, Findings, Remediation, Reports
│   │   └── services/           # Axios API client with interceptors
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express + MongoDB backend
│   ├── src/
│   │   ├── config/             # Environment validation (env.js), DB connection (db.js)
│   │   ├── controllers/        # Auth, Target, Assessment, Finding, Report, Dashboard
│   │   ├── middleware/         # Auth (JWT verification), RateLimiters, Validation, ErrorHandler
│   │   ├── models/             # User, Target, Assessment, Finding (Mongoose schemas)
│   │   ├── routes/             # Modular REST API routes
│   │   ├── seeds/              # Development seed script (demo users, targets, findings)
│   │   ├── services/scanner/   # Modular Assessment Engine
│   │   │   ├── targetValidator.js       # Strict SSRF & CIDR validator
│   │   │   ├── safeHttpClient.js        # Safe bounded HTTP client (redirect re-validator)
│   │   │   ├── scanOrchestrator.js      # Concurrency & lifecycle orchestrator
│   │   │   ├── findingNormalizer.js     # Deterministic rule engine & posture scoring
│   │   │   └── checks/
│   │   │       ├── securityHeaders.js   # CSP, HSTS, X-Content-Type, Clickjacking, Referrer
│   │   │       ├── tlsConfiguration.js  # TLS handshake, cert validity, SANs, ciphers
│   │   │       ├── cookieSecurity.js    # Secure, HttpOnly, SameSite, domain attributes
│   │   │       ├── corsConfiguration.js # Wildcard origins, credentials, origin reflection
│   │   │       ├── httpsRedirect.js     # HTTP->HTTPS upgrade and downgrade detection
│   │   │       ├── robotsExposure.js    # robots.txt path exposure (non-crawled)
│   │   │       ├── securityTxt.js       # RFC 9116 security.txt disclosure standard
│   │   │       └── serverDisclosure.js  # Server banners & X-Powered-By leaks
│   │   └── utils/
│   │       ├── aiExplainer.js           # Built-in security explanation knowledge base
│   │       └── pdfGenerator.js          # Executive PDF generator (PDFKit)
│   └── tests/                  # Node.js native test runner + Supertest test suites
└── README.md
```

---

## Security Assessment Engine: Coverage Matrix

| Category | Rule ID | Severity | What is Inspected |
|---|---|---|---|
| **Headers** | `SEC-HDR-CSP-MISSING` | Medium | Checks presence of `Content-Security-Policy` restricting script and resource execution. |
| **Headers** | `SEC-HDR-CSP-UNSAFE-INLINE` | Low | Detects dangerous `'unsafe-inline'` directive in script-src without cryptographically random nonces. |
| **Headers** | `SEC-HDR-HSTS-MISSING` | Medium | Verifies `Strict-Transport-Security` header to prevent SSL-stripping on HTTPS. |
| **Headers** | `SEC-HDR-XCTO-MISSING` | Low | Verifies `X-Content-Type-Options: nosniff` to prevent MIME-sniffing XSS. |
| **Headers** | `SEC-HDR-CLICKJACKING-DEFENSE-MISSING` | Medium | Checks for CSP `frame-ancestors` or `X-Frame-Options` (DENY / SAMEORIGIN). |
| **Headers** | `SEC-HDR-REFERRER-POLICY-MISSING` | Low | Checks `Referrer-Policy` header to prevent sensitive URL parameters from leaking cross-origin. |
| **TLS/SSL** | `TLS-CERT-EXPIRED` | Critical | Validates whether the remote peer TLS certificate has expired. |
| **TLS/SSL** | `TLS-CERT-EXPIRING-SOON` | Medium/High | Flags certificates expiring within 30 days (High if <= 7 days). |
| **TLS/SSL** | `TLS-DEPRECATED-PROTOCOL` | High | Detects legacy TLSv1.0 or TLSv1.1 negotiations (RFC 8996). |
| **TLS/SSL** | `TLS-HTTPS-NOT-USED` | High | Flags application base URLs operating over cleartext HTTP. |
| **Cookies** | `COOKIE-MISSING-SECURE` | Medium | Flags cookies transmitted over HTTPS without the `Secure` flag. |
| **Cookies** | `COOKIE-MISSING-HTTPONLY` | Low | Flags sensitive cookies accessible to JavaScript (`document.cookie`). |
| **Cookies** | `COOKIE-MISSING-SAMESITE` | Low | Detects cookies without explicit `SameSite=Lax` or `SameSite=Strict`. |
| **CORS** | `CORS-ARBITRARY-ORIGIN-REFLECTED-CREDENTIALS` | Critical | Safely probes with test Origin to detect reflections paired with `Access-Control-Allow-Credentials: true`. |
| **CORS** | `CORS-WILDCARD-WITH-CREDENTIALS` | High | Detects `Access-Control-Allow-Origin: *` configured with credentials allowed. |
| **Redirects**| `REDIRECT-HTTP-TO-HTTPS-MISSING` | High | Tests whether port 80 HTTP automatically enforces a 301 upgrade to HTTPS. |
| **Redirects**| `REDIRECT-HTTPS-DOWNGRADE-DETECTED` | High | Checks for insecure redirect hops downgrading from HTTPS to HTTP. |
| **Disclosure**| `DISCLOSURE-X-POWERED-BY` | Low | Detects server framework disclosure (`X-Powered-By: Express/PHP`). |
| **Disclosure**| `DISCLOSURE-SERVER-VERSION` | Low | Flags exact software release numbers exposed in `Server` banner. |
| **Policy** | `POLICY-SECURITY-TXT-MISSING` | Info | Probes for RFC 9116 `/.well-known/security.txt` vulnerability disclosure file. |

---

## Anti-SSRF Safeguards

TraceGuard enforces strict server-side safeguards before dispatching network requests:
1. **URL Scheme Restriction**: Only `http:` and `https:` schemes are permitted. File, FTP, and data URIs are rejected.
2. **Port Restrictions**: Scans are bounded to standard web ports: `80`, `443`, `8080`, and `8443`.
3. **CIDR Range Blocking**: Rejects:
   - Loopback (`127.0.0.0/8`, `::1`)
   - Private RFC 1918 networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
   - Link-local and Cloud Metadata (`169.254.0.0/16`, `169.254.169.254`, `metadata.google.internal`)
   - Shared Address Space (`100.64.0.0/10`)
   - Multicast & Reserved (`224.0.0.0/4`, `240.0.0.0/4`)
   - IPv4-mapped IPv6 addresses (`::ffff:127.0.0.1`, `::ffff:10.0.0.1`)
4. **Per-Hop Redirect Validation**: Follows up to 5 redirects, resolving and revalidating the destination address on *every single hop* to prevent open redirect SSRF bypasses.
5. **Response Caps & Concurrency**: 512 KB response body limit and 15-second socket timeout prevent memory exhaustion or zip bombs.

---

## REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new auditor account (Name, email, password)
- `POST /api/auth/login` — Sign in with credentials, sets HttpOnly cookie & returns JWT
- `POST /api/auth/logout` — Invalidate session and clear auth cookies
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Targets
- `GET /api/targets` — List all authorized targets for authenticated user with finding counts
- `POST /api/targets` — Register a new target with SSRF validation and authorization agreement
- `GET /api/targets/:id` — Target details and recent assessment history
- `PATCH /api/targets/:id` — Update target name, environment, or scope description
- `DELETE /api/targets/:id` — Delete target and cascade delete all associated scan history

### Assessments
- `GET /api/assessments` — List paginated assessment history with filtering
- `POST /api/assessments` — Queue and start a new asynchronous security assessment
- `GET /api/assessments/:id` — Get live progress percentage, check results, and summary
- `POST /api/assessments/:id/cancel` — Cancel an in-flight assessment
- `GET /api/assessments/:id/findings` — Retrieve findings identified during a specific scan
- `GET /api/assessments/compare?firstId=...&secondId=...` — Compare two assessments of the same target

### Findings
- `GET /api/findings` — Inventory of findings with search and multi-attribute filters
- `GET /api/findings/:id` — Detail view with observed evidence, remediation checklist, and history
- `PATCH /api/findings/:id/status` — Transition finding status (`Open`, `In Progress`, `Fixed`, `Accepted Risk`) with required reason
- `POST /api/findings/:id/notes` — Append remediation team note
- `POST /api/findings/:id/explain` — Educational plain-English explanation of finding

### Reports & Dashboard
- `GET /api/reports/:assessmentId/pdf` — Stream downloadable executive PDF report
- `GET /api/reports/:assessmentId/json` — Export structured JSON audit report
- `GET /api/dashboard/summary` — Overview metrics: assessments, open findings, posture score
- `GET /api/dashboard/trends` — Posture score history timeline and category breakdown

---

## Quick Start & Local Setup

### Prerequisites
- **Node.js** v18+ (tested on Node v22.14.0)
- **MongoDB** running locally or a MongoDB Atlas connection URI

### 1. Configure Server Environment
```bash
cd server
cp .env.example .env
```
Ensure `server/.env` contains your settings:
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
```

### 2. Seed Demo Data (Optional but Recommended)
Populates initial demo accounts, authorized targets, completed scans, and sample findings:
```bash
cd server
npm run seed
```
**Demo Login Credentials:**
- Email: `auditor@traceguard.dev`
- Password: `Password123!`

### 3. Run the Backend Server
```bash
cd server
npm run dev
```
The server will run on `http://localhost:5000` with the health check at `http://localhost:5000/api/health`.

### 4. Run the Frontend Client
In a separate terminal:
```bash
cd client
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Running Automated Tests

### Backend Test Suite (Node Native Test Runner + Supertest)
Runs 13 tests covering SSRF blocking, IPv4/IPv6 CIDR ranges, cloud metadata rejection, header inspection rules, cookie security, and JWT auth flow:
```bash
cd server
npm test
```

### Frontend Test Suite (Vitest + React Testing Library)
Runs component tests covering Severity and Status Badges, ScoreDial heuristic rendering, EmptyState, and the Landing Page:
```bash
cd client
npm test
```

---

## Responsible Security Disclaimer

TraceGuard performs automated, passive configuration audits against explicitly authorized targets. The security posture score is an internal heuristic based on observable HTTP headers and network responses.

**TraceGuard does NOT certify an application as invulnerable.** Automated baseline assessments do not replace periodic comprehensive penetration testing, secure code review, and defense-in-depth architectural reviews.
