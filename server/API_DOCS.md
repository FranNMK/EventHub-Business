# EventHub Business Platform - API Documentation

## Base URL
http://localhost:5000/api

---

## Authentication

All protected routes require a Bearer token in the Authorization header:

`Authorization: Bearer <token>`

---

## 1. Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Secure@123",
    "role": "employee"
}
```
Roles allowed: `admin`, `vendor`, `employee`

Success Response (201):

```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "employee" },
        "token": "eyJhbG...",
        "refreshToken": "eyJhbG..."
    }
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "Secure@123"
}
```

Success Response (200):
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "employee" },
        "token": "eyJhbG...",
        "refreshToken": "eyJhbG..."
    }
}
```

### POST /api/auth/refresh
Refresh an expired JWT token.

**Request Body:**
```json
{
    "refreshToken": "eyJhbG..."
}
```

Success Response (200):
```json
{
    "success": true,
    "data": {
        "token": "eyJhbG...",
        "refreshToken": "eyJhbG..."
    }
}
```

### GET /api/auth/profile
Get current user profile. Requires Auth.

Success Response (200):
```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "employee",
        "phone": null,
        "avatar_url": null,
        "created_at": "2026-05-14T..."
    }
}
```

### PUT /api/auth/profile
Update user profile. Requires Auth.

**Request Body:**
```json
{
    "name": "John Updated",
    "phone": "+1234567890"
}
```

### PUT /api/auth/change-password
Change password. Requires Auth.

**Request Body:**
```json
{
    "currentPassword": "Old@123",
    "newPassword": "New@456"
}
```

### POST /api/auth/logout
Logout and invalidate refresh token. Requires Auth.

**Request Body:**
```json
{
    "refreshToken": "eyJhbG..."
}
```

---

## 2. Event Endpoints

### GET /api/events/public
Get published events (no auth required).

**Query Parameters:**
- `search` (string) — Search by title/location
- `page` (number) — default `1`
- `limit` (number) — default `9`

Success Response (200):
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title": "Annual General Meeting",
            "description": "...",
            "date": "2026-06-15",
            "time": "09:00:00",
            "location": "Grand Hall",
            "capacity": 250,
            "available_slots": 180,
            "status": "published",
            "registration_count": 70
        }
    ],
    "pagination": { "page": 1, "limit": 9, "total": 1, "pages": 1 }
}
```

### GET /api/events
Get all events. Requires Auth. Filtered by role.

Query Parameters: Same as public + `status` filter (`all`, `published`, `draft`, `completed`)

### GET /api/events/:id
Get single event with registrations. Requires Auth.

Success Response (200):
```json
{
    "success": true,
    "data": {
        "id": 1,
        "title": "Annual General Meeting",
        "description": "...",
        "date": "2026-06-15",
        "time": "09:00:00",
        "location": "Grand Hall",
        "capacity": 250,
        "available_slots": 180,
        "status": "published",
        "creator_name": "Admin User",
        "registrations": [
            { "id": 1, "user_name": "John", "status": "registered", "registration_date": "..." }
        ]
    }
}
```

### POST /api/events
Create new event. Requires Auth. Admin only.

**Request Body:**
```json
{
    "title": "Annual General Meeting",
    "description": "Join us for the AGM...",
    "date": "2026-06-15",
    "time": "09:00:00",
    "location": "Grand Conference Hall",
    "capacity": 250,
    "status": "draft"
}
```

Success Response (201):
```json
{
    "success": true,
    "message": "Event created successfully",
    "data": { "id": 1, "title": "Annual General Meeting" }
}
```

### PUT /api/events/:id
Update event. Requires Auth. Admin only.

### DELETE /api/events/:id
Delete event. Requires Auth. Admin only.

### PATCH /api/events/:id/status
Update event status only. Requires Auth. Admin only.

**Request Body:**
```json
{
    "status": "published"
}
```

Valid statuses: `draft`, `published`, `completed`, `cancelled`

---

## 3. Registration Endpoints

### GET /api/registrations
Get current user's registrations. Requires Auth.

Success Response (200):
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "event_id": 1,
            "event_title": "Annual General Meeting",
            "event_date": "2026-06-15",
            "status": "registered",
            "registration_date": "2026-05-14T...",
            "qr_code": "data:image/png;base64,...",
            "qr_token": "abc123..."
        }
    ]
}
```

### POST /api/registrations
Register for an event. Requires Auth. Employee/Vendor only.

**Request Body:**
```json
{
    "eventId": 1
}
```

Success Response (201):
```json
{
    "success": true,
    "message": "Successfully registered for the event",
    "data": {
        "id": 1,
        "event_title": "Annual General Meeting",
        "status": "registered",
        "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
        "qr_token": "abc123def456..."
    }
}
```

**Error Responses:**
- `400` - Event fully booked, past event, or capacity full
- `404` - Event not found
- `409` - Already registered

### DELETE /api/registrations/:id
Cancel registration. Requires Auth.

Success Response (200):
```json
{
    "success": true,
    "message": "Registration cancelled successfully"
}
```

### GET /api/registrations/event/:eventId
Get all registrations for an event. Requires Auth. Admin only.

---

## 4. Vendor Endpoints

### GET /api/vendors
Get all vendors. Public sees only approved. Admin sees all.

**Query Parameters:**
- `approved` (string) — true/false filter
- `serviceType` (string) — Filter by service type
- `search` (string) — Search by company name

### GET /api/vendors/:id
Get single vendor with services.

### GET /api/vendors/my-profile
Get own vendor profile. Requires Auth. Vendor only.

Success Response (200):
```json
{
    "success": true,
    "data": {
        "id": 1,
        "company_name": "Elite Catering",
        "service_type": "catering",
        "is_approved": false,
        "status_reason": "Need more details",
        "status_history": []
    }
}
```

### POST /api/vendors/register
Register as vendor. Requires Auth. Vendor role.

**Request Body:**
```json
{
    "companyName": "Elite Catering Services",
    "serviceType": "catering",
    "description": "Premium corporate catering",
    "contactEmail": "info@elitecatering.com",
    "contactPhone": "+1234567890",
    "website": "www.elitecatering.com",
    "address": "123 Business St"
}
```

### PUT /api/vendors/:id
Update vendor profile. Requires Auth.

### PATCH /api/vendors/:id/approve
Approve/reject vendor. Requires Auth. Admin only.

**Request Body:**
```json
{
    "approved": true,
    "reason": "Verified business credentials"
}
```

### GET /api/vendors/:id/history
Get vendor status history. Requires Auth. Admin only.

---

## 5. Service Endpoints

### GET /api/services
Get all available services (public).

### GET /api/services/:id
Get single service details.

### GET /api/services/my/list
Get vendor's own services. Requires Auth. Vendor only.

### POST /api/services
Create service. Requires Auth. Vendor only (approved).

**Request Body:**
```json
{
    "name": "Corporate Lunch Package",
    "description": "Full lunch for 50 people",
    "price": 500.00,
    "duration": "3 hours",
    "isAvailable": true
}
```

### PUT /api/services/:id
Update service. Requires Auth. Vendor only.

### DELETE /api/services/:id
Delete service. Requires Auth. Vendor only.

### PATCH /api/services/:id/toggle
Toggle service availability. Requires Auth. Vendor only.

---

## 6. Health Check

### GET /api/health
Check API status (no auth).

Response:
```json
{
    "success": true,
    "message": "EventHub Business API is running",
    "version": "1.0.0",
    "timestamp": "2026-05-14T..."
}
```

## Error Response Format
All errors follow this format:

```json
{
    "success": false,
    "message": "Error description",
    "errors": [
        { "field": "email", "message": "Invalid email format" }
    ]
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 304 | Not Modified (cached) |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (no token) |
| 403 | Forbidden (wrong role) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Server Error |

## Authentication Flow
1. `POST /api/auth/register` → Get `token` + `refreshToken`
2. `POST /api/auth/login` → Get `token` + `refreshToken`
3. Use `token` in `Authorization` header for all requests
4. When token expires → `POST /api/auth/refresh` with `refreshToken`
5. `POST /api/auth/logout` → Invalidate `refreshToken`
