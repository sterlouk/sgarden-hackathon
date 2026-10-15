# SGarden: DevSecOps Hackathon 🥈 2nd place

A university hackathon run by **ISSEL** (Intelligent Systems & Software Engineering Labgroup, ECE, Aristotle University of Thessaloniki), held 17–21 December 2025.

Every team received the same full-stack web platform, **SGarden**, seeded on purpose with security vulnerabilities and code-quality problems. Over four days, teams had to harden it. Scoring was automatic across **DevSecOps metrics** for both the frontend and the backend:

- SAST findings
- DAST findings
- Vulnerable dependencies
- Coding violations
- Code duplication
- Test coverage

Our team of three finished **2nd**.

| | |
|---|---|
| **Backend** | Node.js · Express · MongoDB (Mongoose) · JWT auth · AVA + c8 tests |
| **Frontend** | React · Material UI · CRACO · Cypress |
| **Team** | Stergios Loukas · Eleftherios Trempelas · Styliani Simopoulou |

## What we fixed

### Backend
- **Path traversal** in every file-serving route (reports, templates, uploads, config, CSV export, compression). It was the most heavily flagged class of issue. One guard function, `getSafePath`, now protects all of them:
  - rejects absolute paths, `..`, backslashes and null bytes;
  - allowlists simple file names;
  - resolves the path and checks it stays inside a fixed base directory;
  - re-checks with `realpath` so symlinks can't escape.
- **Command injection:** the `/system/spawn` endpoint passed user input to a process. Input is now strictly validated and nothing is executed.
- **Mass assignment:** the custom-report endpoint accepts only an allowlist of keys.
- **Upload and request limits:** a 10 MB upload cap, centralized filename validation, and JSON and form body size limits.
- **Security headers** via Helmet for DAST.
- **Dependencies:** updated until `npm audit` reported 0 vulnerabilities at the time.
- **Tests:** expanded to **254 passing tests at 92.7% line coverage**.

### Frontend
- **SAST and ESLint violations** across the app.
- **Vulnerable dependencies** patched.
- **DAST:** security headers on every response from the dev server that was scanned:
  - a Content-Security-Policy with `script-src 'self'` and no `unsafe-eval` or inline scripts;
  - `frame-ancestors` and other hardening headers;
  - no `X-Powered-By`.
- **Duplication:** de-duplicated the auth layout, guards, forms and sign-up screens with a shared builder.

### My part
- Path traversal fixes in the data and user-profile routes.
- SAST and DAST remediation on both apps.
- Dependency vulnerability fixes.
- The auth de-duplication refactors on the frontend.
- Coding-violation clean-up.
- Backend test work.

## Lessons learned

**Scanners match patterns, not intent.** Our path-traversal guard was correct well before the end, yet the SAST rule kept flagging it, because user input still flowed into `path.resolve()`. As an experiment, we aliased the import (`resolve as solvere`) and the finding disappeared. That showed the rule was matching names, not tracking whether the data had been validated. We kept the readable version. Silencing a scanner is not the same as fixing a vulnerability, and a false positive is best handled with a documented suppression, not a disguise.

**DAST findings fight each other.** Every tightening of CSP and CORS for the scanner risked breaking the frontend. Several header changes went in and out more than once during the last day.

## Known remaining issues

This is the code as submitted. A security review today would still flag:

- **Permissive CORS.** `cors({ origin: true, credentials: true })` reflects any origin while allowing credentials. A stricter, environment-driven allowlist was tried, then reverted late in the event because it broke the frontend. The right fix is an explicit origin allowlist from `CLIENT_URL`.
- **CSP still allows inline styles** (`style-src 'unsafe-inline'`), which Material UI's runtime styling needs. Nonce-based styles would remove that.
- **Dependencies have aged.** `npm audit` now reports new advisories (e.g. in axios, mongoose and lodash) published after the hackathon. The repo is kept as a snapshot; the original submission is tagged [`hackathon-final`](https://github.com/sterlouk/sgarden-hackathon/tree/hackathon-final).
- **Frontend lint** crashes on Node 24, due to an incompatible `eslint-plugin-unicorn` rule. Use Node 18/20 to run it.
- The frontend README still mentions `npm run start:prod`. That script was removed when the production-server experiment was reverted.

## Running it

**Requirements:** Node 18 or 20. MongoDB is needed only to run the backend for real; the tests use an in-memory MongoDB.

```bash
# Backend
cd backend
cp .env.sample .env        # set DATABASE_URL, SERVER_SECRET, CLIENT_URL, PORT
npm ci
npm test                   # 254 tests with coverage
npm run dev

# Frontend (second terminal)
cd frontend
cp .env.sample .env        # set REACT_APP_MAIN_SERVER_URL to the backend URL
npm ci
npm start
```

## Repository history

During the hackathon, the backend and frontend lived in two separate repositories. They were combined here with their **full commit history and original authors**, each moved into its own folder (`git log -- backend/...` works as before). The original per-project READMEs are in [`backend/`](backend/README.md) and [`frontend/`](frontend/README.md).
