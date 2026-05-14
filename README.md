# EventHub Business

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](.) [![Node.js](https://img.shields.io/badge/Node.js-v16+-green)](https://nodejs.org) [![License](https://img.shields.io/badge/license-ISC-yellow)](LICENSE)

A polished, full-stack event management platform built as the reference implementation for the ICT Solutions Skills Competition 2026. EventHub Business helps organizations create events, onboard vendors, manage registrations (with QR tickets), and view analytics — with clear role-based access for Admins, Vendors and Employees.

---

**Table of contents**
- [Project Overview](#project-overview)
- [Highlights](#highlights)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Endpoints & Testing](#api-endpoints--testing)
- [Front-end Notes](#front-end-notes)
- [Database & Seed Data](#database--seed-data)
- [Security](#security)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

---

## Project Overview

EventHub Business is a web application to manage corporate events end-to-end:
- Create, publish, and schedule events with capacity control
- Register vendors and manage vendor services
- Employee registration with QR ticket generation for check-in
- Role-based dashboards and reports for Admins, Vendors, and Employees
- Lightweight server (Express.js) with a modular MVC structure and a responsive front-end (vanilla JS)

## Highlights
- QR code ticketing generated server-side and stored with registrations
- Token-based auth (JWT) with refresh token support
- Re-usable API service and centralized config on the client
- Mobile-first responsive UI with an accessible dashboard

## Tech Stack
- Backend: Node.js, Express.js
- Database: TiDB Cloud (MySQL-compatible) via `mysql2/promise` pool
- Auth: `jsonwebtoken`, `bcryptjs`
- Utilities: `helmet`, `cors`, `morgan`
- QR generation: `qrcode` (server-side data URLs)
- Frontend: Vanilla ES6 JavaScript, CSS Grid/Flexbox, Font Awesome

## Repository Structure

Top-level layout (abridged):

- `client/` — Frontend site (HTML/CSS/JS)
  - `pages/` — Single-page HTML views (dashboard, register, login, etc.)
  - `js/` — Client scripts (utils, components, pages)
  - `css/` — Styles (main, components, responsive, dashboard)
- `server/` — Backend API
  - `controllers/` — Route handlers (auth, events, registrations...)
  - `routes/` — Express routes mounted under `/api`
  - `middleware/` — Auth, validation, error handling
  - `config/database.js` — DB pool + schema initialization
- `database/schema.sql` — canonical schema

See the full tree in the repository for details.

## Quick Start

Prerequisites:
- Node.js v16+ and `npm` (or `yarn`)
- TiDB Cloud or MySQL-compatible database
- Git

1. Clone the repo

```bash
git clone https://github.com/FranNMK/EventHub-Business.git
cd EventHub-Business
```

2. Backend setup

```bash
cd server
npm install
# create a `.env` file (see Environment Variables below)
npm run dev
# server will run on http://localhost:5000 (default)
```

3. Frontend (development)

```bash
# in a new terminal
cd client
npx live-server --port=5500
# open http://127.0.0.1:5500
```

## Environment Variables
Create `server/.env` with values similar to the example below:

```
PORT=5000
NODE_ENV=development

DB_HOST=your_tidb_host
DB_PORT=4000
DB_USER=your_tidb_user
DB_PASSWORD=your_tidb_password
DB_NAME=eventhub_business
DB_SSL=true

JWT_SECRET=your_secret_key_here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

APP_NAME=EventHub Business Platform
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5500
```

## API Endpoints & Testing
- Health: `GET /api/health`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`
- Events: `GET/POST/PUT/DELETE /api/events`
- Registrations: `POST /api/registrations` (creates QR code), `DELETE /api/registrations/:id`

You can use Curl or Postman/Thunder Client. Example health check:

```bash
curl http://localhost:5000/api/health
```

Example register (cURL):

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test@123","role":"employee"}'
```

### Default Test Accounts (for local testing)
| Role | Email | Password |
|------|-------|----------|
| Admin | frankmk2025@gmail.com | Admin@123 |
| Employee | employee@test.com | Emp@123 |
| Vendor | vendor@test.com | Vendor@123 |

> NOTE: Use these accounts only in local development; rotate credentials for any shared deployments.

## Front-end Notes
- Client config lives in `client/js/utils/config.js` — update `API_URL` if backend runs on a different host/port.
- The front-end uses an API service with a 15s request timeout and automatic token refresh logic.
- The dashboard stores `currentRegistrations` (with `qr_code` data URLs) and exposes a small modal to view/download QR images.

## Database & Seed Data
- `server/config/database.js` creates required tables on first run (users, vendors, events, services, registrations, refresh_tokens, vendor_status_history).
- Use the provided seed scripts in `server/utils/` to create sample data for local testing.

## Security
- Passwords hashed using `bcryptjs` (12 salt rounds)
- JWT short-lived access + refresh token pattern
- Parameterized queries to avoid SQL injection
- Helmet + CORS configured for safe defaults

## Contributing
- Fork the repo, create a feature branch, open a PR with tests and description.
- Keep UI changes accessible and responsive.
- For backend changes include new migrations or updates to `schema.sql`.

## Author
Francis NMK — contributor and organizer

GitHub: https://github.com/FranNMK

## License
ISC

---

If you'd like, I can also:
- Add a short screenshots / assets gallery section
- Add step-by-step screenshots for installation
- Generate a small `CONTRIBUTING.md` and `ISSUE_TEMPLATE.md`

Tell me which additions you want and I'll apply them.