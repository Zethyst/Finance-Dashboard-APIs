# Finance Dashboard API

A role-based RESTful backend for a finance dashboard system, built with **Node.js**, **Express**, and **MongoDB**.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Role & Permission Model](#role--permission-model)
- [API Reference](#api-reference)
- [Design Decisions & Tradeoffs](#design-decisions--tradeoffs)

---

## Features

- JWT-based authentication
- Role-based access control (Viewer / Analyst / Admin)
- Financial record management with soft delete
- Rich dashboard aggregation APIs (summary, trends, category breakdown)
- Input validation via Joi schemas
- Pagination, filtering, and search on all list endpoints
- Rate limiting, Helmet security headers, NoSQL injection protection
- Centralized error handling with environment-aware responses
- Database seeder for quick local testing

---

## Architecture

```
src/
├── config/
│   ├── constants.js       # Roles, categories, pagination defaults
│   └── database.js        # Mongoose connection
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── transactionController.js
│   └── dashboardController.js  # All aggregation logic lives here
├── middleware/
│   ├── auth.js            # protect, restrictTo, requireRoleLevel
│   ├── errorHandler.js    # Global Express error handler
│   └── validate.js        # Joi schema validation factory
├── models/
│   ├── User.js
│   └── Transaction.js     # Includes soft-delete pre-query hook
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── transactionRoutes.js
│   └── dashboardRoutes.js
├── utils/
│   ├── AppError.js        # Custom error class (operational vs programming)
│   ├── asyncHandler.js    # Eliminates try/catch boilerplate
│   ├── apiResponse.js     # Consistent response shape
│   ├── jwt.js
│   ├── pagination.js
│   └── seeder.js          # Test data generator
├── validators/
│   ├── authValidator.js
│   ├── transactionValidator.js
│   └── userValidator.js
├── app.js                 # Express setup, middleware chain, routes
└── server.js              # DB connect → HTTP listen → graceful shutdown
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Validation | Joi |
| Password hashing | bcryptjs |
| Security | Helmet, express-mongo-sanitize, express-rate-limit |
| Logging | Morgan |

---

## Getting Started

**Prerequisites:** Node.js 18+, MongoDB 6+ running locally (or a MongoDB Atlas URI)

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd finance-dashboard
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET at minimum

# 3. Seed the database with sample data and test users
npm run seed

# 4. Start the dev server
npm run dev

# Server starts at http://localhost:5000
# Health check: GET http://localhost:5000/health
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | 5000 | HTTP port |
| `NODE_ENV` | No | development | `development` or `production` |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWTs (use a long random string) |
| `JWT_EXPIRE` | No | 7d | Token expiry (e.g. `1d`, `7d`, `24h`) |
| `BCRYPT_ROUNDS` | No | 12 | bcrypt cost factor |
| `CORS_ORIGIN` | No | * | Allowed CORS origin |

---

## Role & Permission Model

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Login / view own profile | ✅ | ✅ | ✅ |
| View transactions | ❌ | ✅ | ✅ |
| View dashboard / analytics | ❌ | ✅ | ✅ |
| Create / update / delete transactions | ❌ | ❌ | ✅ |
| Manage users (list, update, delete) | ❌ | ❌ | ✅ |

Two access-control helpers are used depending on the scenario:
- `restrictTo('admin')` — exact role match, used where only one role is valid
- `requireRoleLevel('analyst')` — hierarchy-aware, allows analyst AND admin

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <token>
```

---

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create an account |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| GET | `/api/auth/me` | Any | Get own profile |
| PATCH | `/api/auth/change-password` | Any | Change password |

**Register / Login request body:**
```json
{ "email": "user@example.com", "password": "Secret@123", "name": "Alice", "role": "viewer" }
```

**Success response shape:**
```json
{
  "status": "success",
  "message": "Logged in successfully.",
  "data": { "token": "eyJ...", "user": { ... } }
}
```

---

### Users *(Admin only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List users (paginated) |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update name / role / status |
| DELETE | `/api/users/:id` | Delete user |

**Query parameters for `GET /api/users`:**

| Param | Type | Example |
|---|---|---|
| `role` | string | `admin`, `analyst`, `viewer` |
| `status` | string | `active`, `inactive` |
| `search` | string | partial match on name or email |
| `page` | number | `1` |
| `limit` | number | `20` (max 100) |

---

### Transactions *(Analyst/Admin: read; Admin: write)*

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/transactions` | Analyst+ | List (paginated, filterable) |
| GET | `/api/transactions/:id` | Analyst+ | Get single transaction |
| POST | `/api/transactions` | Admin | Create |
| PATCH | `/api/transactions/:id` | Admin | Update |
| DELETE | `/api/transactions/:id` | Admin | Soft delete |

**Create / Update body fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `amount` | number | Yes (create) | Positive, 2 decimal places |
| `type` | string | Yes (create) | `income` or `expense` |
| `category` | string | Yes (create) | See categories list below |
| `date` | ISO date | No | Defaults to now, cannot be future |
| `description` | string | No | Max 500 chars |

**Categories:** `salary`, `freelance`, `investment`, `rental`, `business`, `food`, `transport`, `utilities`, `entertainment`, `healthcare`, `education`, `shopping`, `travel`, `insurance`, `taxes`, `other`

**Query parameters for `GET /api/transactions`:**

| Param | Example |
|---|---|
| `type` | `income` |
| `category` | `salary` |
| `startDate` | `2024-01-01` |
| `endDate` | `2024-03-31` |
| `minAmount` | `100` |
| `maxAmount` | `5000` |
| `search` | `groceries` |
| `sortBy` | `amount` (default: `date`) |
| `order` | `asc` (default: `desc`) |
| `page` / `limit` | pagination |

**Paginated response shape:**
```json
{
  "status": "success",
  "message": "Transactions fetched.",
  "data": { "transactions": [...] },
  "meta": {
    "total": 87,
    "page": 2,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

---

### Dashboard *(Analyst and Admin)*

All dashboard endpoints accept optional `startDate` / `endDate` query params (default: current calendar month).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/overview` | Combined summary + top categories + recent activity (single round-trip) |
| GET | `/api/dashboard/summary` | Total income, expenses, net balance, counts |
| GET | `/api/dashboard/category-breakdown` | Per-category totals grouped by type |
| GET | `/api/dashboard/monthly-trends` | Monthly income vs expense for past N months |
| GET | `/api/dashboard/weekly-trends` | Daily totals for the last 7 days |
| GET | `/api/dashboard/recent-activity` | N most recent transactions |

**`/monthly-trends` params:**
- `months` — how many months back to include (default: 6, max: 24)

**`/recent-activity` params:**
- `limit` — number of records to return (default: 10, max: 50)

**Overview response example:**
```json
{
  "data": {
    "summary": {
      "totalIncome": 12500.00,
      "totalExpenses": 4800.00,
      "netBalance": 7700.00,
      "transactionCount": 23
    },
    "topCategories": [
      { "category": "salary", "type": "income", "total": 10000.00, "count": 2 }
    ],
    "recentActivity": [ ... ]
  }
}
```

---

## Design Decisions & Tradeoffs

**Soft delete over hard delete**
Transactions are soft-deleted (`isDeleted: true`) rather than removed from the database. This preserves audit history and allows for potential recovery. The Mongoose pre-query hook ensures deleted records are automatically excluded from all normal queries without requiring changes to every controller.

**`requireRoleLevel` vs `restrictTo`**
Two middleware helpers cover different authorization patterns. `restrictTo` is used for exact role matching (admin-only user management). `requireRoleLevel` uses a numeric hierarchy, so granting analyst access to a route automatically grants admin access too — without having to enumerate both roles.

**Joi validation as middleware**
Validation is separated from controllers entirely via a `validate(schema)` middleware factory. This keeps controllers free of parsing logic and makes validation rules easy to read, test, and modify independently.

**Aggregation pipelines in the dashboard controller**
All `$group` / `$match` aggregations are isolated in `dashboardController.js`. The `/overview` endpoint uses `Promise.all` to run three aggregations concurrently, minimizing latency for the primary dashboard load.

**AppError class**
The `isOperational` flag distinguishes expected errors (validation failure, not found, unauthorized) from unexpected programming errors. In production, only operational errors expose their message to the client; everything else returns a generic 500. This prevents internal implementation details from leaking.

**JWT only (no refresh tokens)**
Refresh tokens add significant complexity. For this scope, a 7-day JWT is a reasonable tradeoff. In a production system with stricter security requirements, a short-lived access token + refresh token pattern would be preferable.

**No soft-delete for users**
Users are hard-deleted because the `createdBy` reference on transactions is the meaningful audit trail. Deactivating (`status: inactive`) is the preferred way to revoke access without deleting the account.
