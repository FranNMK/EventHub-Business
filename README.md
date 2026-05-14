# EventHub Business Platform

EventHub Business is a full-stack event management platform developed for the ICT Solutions Skills Competition 2026. It provides organizations with tools to manage corporate events, vendors, attendee registrations and reporting.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Responsive Design](#responsive-design)
- [Testing](#testing)
- [License](#license)
- [Author](#author)

---

## Project Overview

EventHub Business is a web-based platform that enables organizations to:

- Manage corporate events and vendor interactions
- Handle employee registrations and attendance tracking
- Generate QR codes for event check-ins
- Provide reporting and CSV exports for analytics

## Key Features

- User authentication with JWT and refresh tokens
- Role-based access control (Admin, Vendor, User)
- Event creation and management
- Vendor registration and approval workflow
- Attendee registrations and QR check-in
- CSV export for event reports

## Tech Stack

### Backend

- Runtime: Node.js with Express
- Database: TiDB Cloud (MySQL-compatible) or MySQL
- Authentication: JWT with refresh tokens
- Security: bcrypt, helmet, CORS, rate limiting
- QR Codes: QR generation library
- Reports: CSV export

### Frontend (Module 2)

- Framework: Vanilla JavaScript (ES6 modules)
- Styling: CSS Grid & Flexbox (mobile-first)
- Charts: Chart.js
- HTTP client: Fetch API with interceptors

## Project Structure

```
EventHub-Business/
├── client/         # Frontend application
│   ├── assets/     # Images, icons, fonts
│   ├── css/        # Stylesheets
│   ├── js/         # JavaScript modules
│   └── pages/      # HTML pages
├── server/         # Backend API
│   ├── config/     # Database configuration
│   ├── controllers/# Route controllers
│   ├── middleware/ # Auth & error handling
│   ├── models/     # Database models
│   ├── routes/     # API routes
│   ├── utils/      # Helper functions
│   └── server.js   # Entry point
└── database/       # SQL scripts & schema
	└── schema.sql
```

## Database Schema

### Entity Relationships

- `Users` (1) → (1) `Vendors` (for vendor users)
- `Users` (1) → (M) `Events` (created events)
- `Users` (1) → (M) `Registrations` (event registrations)
- `Events` (1) → (M) `Registrations` (event attendees)
- `Vendors` (1) → (M) `Services` (offered services)

## Quick Start

### Prerequisites

- Node.js v16+
- TiDB Cloud account (or MySQL 5.7+)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/FranNMK/EventHub-Business.git
cd EventHub-Business
```

2. Setup backend

```bash
cd server
npm install
```

3. Environment

Copy the example environment and configure your credentials:

```bash
cp .env.example .env
# Edit server/.env with your TiDB/MySQL credentials and JWT secret
```

Example `server/.env` entries:

```
DB_HOST=your_tidb_host
DB_PORT=4000
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=eventhub_business
JWT_SECRET=your_secret_key
```

4. Run the server (development)

```bash
npm run dev
# The server will create tables on first run if configured to do so
```

5. Verify the API

```bash
curl http://localhost:5000/api/health
```

## API Endpoints

Authentication (Module 2)

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — User login
- `POST /api/auth/refresh` — Refresh access token
- `GET /api/auth/profile` — Get user profile
- `PUT /api/auth/profile` — Update profile

Events (Module 3)

- `GET /api/events` — List events
- `POST /api/events` — Create event (Admin)
- `GET /api/events/:id` — Event details
- `PUT /api/events/:id` — Update event
- `DELETE /api/events/:id` — Delete event

Vendors (Module 4)

- `POST /api/vendors/register` — Vendor registration
- `GET /api/vendors` — List vendors
- `PUT /api/vendors/:id` — Update vendor
- `PATCH /api/vendors/:id/approve` — Approve vendor (Admin)

Services (Module 4)

- `POST /api/services` — Add service (Vendor)
- `GET /api/services` — List services
- `PUT /api/services/:id` — Update service

Registrations (Module 5)

- `POST /api/registrations` — Register for event
- `GET /api/registrations` — User registrations
- `DELETE /api/registrations/:id` — Cancel registration

Reports (Module 6)

- `GET /api/reports/dashboard` — Admin dashboard stats
- `GET /api/reports/events/:id/export` — Export registrations CSV

## Security

- Password hashing with `bcrypt` (12 rounds)
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS protection
- Rate limiting on authentication routes
- Parameterized queries to mitigate SQL injection

## Responsive Design

- Mobile-first approach using CSS Grid & Flexbox
- Breakpoints: 480px, 768px, 1024px, 1200px
- Touch-friendly UI controls

## Testing

- Postman collection included for API tests (see `client` or `server` docs)
- Test commands and CI configuration will be added in Module 7

## License

ISC — Created for ICT Skills Competition 2026

## Author

Francis NMK



