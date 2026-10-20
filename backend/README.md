# KINETIC Backend

Express + MongoDB API for the KINETIC business platform (Prayagraj, India).

The platform is split into **three completely separate areas**, and the backend enforces that
separation with **different roles, different cookies and different JWT secrets**:

| # | Area | Who | Login | Cookie | JWT secret |
| - | ---- | --- | ----- | ------ | ---------- |
| 1 | **Public website** | Visitors | none | none | none |
| 2 | **User portals** | Employees and customers | `POST /auth/employee/login`, `POST /auth/customer/login` | `kinetic_employee`, `kinetic_customer` | `JWT_SECRET_EMPLOYEE`, `JWT_SECRET_CUSTOMER` |
| 3 | **Admin panel** | Founders only | `POST /auth/admin/login` | `kinetic_admin` | `JWT_SECRET_ADMIN` |

Being signed in to one portal gives you **zero** access to any other portal.

- Node.js >= 18 (CommonJS — every file starts with `'use strict'` and uses `require`)
- Express 4, Mongoose 8, Zod validation, JWT in httpOnly cookies, bcryptjs
- Dev tooling: nodemon, eslint, prettier
- Base path: **`/api/v1`**

---

## 1. Folder structure

```
backend/
├── package.json              scripts: dev / start / seed / lint / lint:fix / format
├── .env.example              copy to `.env` and adjust
├── .env                      real config (gitignored)
├── .eslintrc.json            eslint (node + commonjs + prettier)
├── .prettierrc               printWidth 100, singleQuote, lf
├── .gitignore
├── README.md
├── uploads/                  uploaded project images (gitignored, keeps .gitkeep)
└── src/
    ├── server.js             connect DB → start server → graceful shutdown
    ├── app.js                express app: security middleware, routes, error handler
    ├── config/
    │   ├── env.js            Zod-validated environment variables (+ JWT/cookie maps)
    │   ├── db.js             mongoose connect / disconnect
    │   ├── cors.js           CORS locked to CLIENT_URL with credentials
    │   └── mailer.js         nodemailer transport (console fallback when SMTP empty)
    ├── models/               User, Project, Task, Inquiry, Ticket, LeaveRequest,
    │                         Announcement, Invoice, Message, AuditLog
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── public/           project, inquiry
    │   ├── admin/            dashboard, employee, customer, project, task, inquiry,
    │   │                     ticket, leave, announcement, invoice, audit, settings
    │   ├── employee/         dashboard, profile, task, project, leave,
    │   │                     announcement, message
    │   └── customer/         dashboard, profile, project, ticket, invoice,
    │                         announcement, message
    ├── routes/               index (mounts everything under /api/v1), public, auth,
    │                         admin, employee, customer
    ├── middleware/           authenticate, requireRole, validate, errorHandler,
    │                         rateLimiter, notFound, upload, auditLogger
    ├── validators/           Zod schemas: auth, common, inquiry, project, task,
    │                         ticket, leave, announcement, invoice, user, message
    ├── services/             emailService, tokenService, auditService
    ├── seed/seed.js          npm run seed
    └── utils/                ApiError, asyncHandler, logger, pagination, slug
```

---

## 2. Setup on Windows (PowerShell)

### Prerequisites

| Tool | Required | Notes |
| --- | --- | --- |
| Node.js | >= 18 (tested on 22.17.1) | `node -v` |
| npm | >= 9 (tested on 11.5.1) | `npm -v` |
| MongoDB | 8.0 local `mongod`, or MongoDB Atlas | backend only |

### Install

```powershell
cd D:\SvapNora\backend
npm install
```

### Configure

```powershell
Copy-Item .env.example .env
```

Then edit `.env` (see section 3).

> **Quoting rule:** any value containing `#` **must be quoted**. dotenv truncates unquoted
> values at `#`, so `ADMIN_PASSWORD=ChangeMe#Admin2026` silently becomes `ChangeMe`.

### Run

```powershell
npm run seed     # optional: wipe + load demo data
npm run dev      # nodemon, http://localhost:5000
```

Production:

```powershell
npm start        # node src/server.js
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | nodemon on `src/server.js` |
| `npm start` | plain node, no watcher |
| `npm run seed` | clears every collection and rebuilds demo data |
| `npm run lint` | eslint over `src/` |
| `npm run lint:fix` | eslint with `--fix` |
| `npm run format` | prettier `--write` over `src/**/*.js` |

### MongoDB Atlas (if nothing is listening on port 27017)

1. Create a free M0 cluster at <https://www.mongodb.com/cloud/atlas>.
2. Database Access → add a user with *Read and write to any database*.
3. Network Access → add your IP (or `0.0.0.0/0` for quick local testing).
4. Connect → Drivers → copy the URI and put it in `.env`:

```
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/kinetic?retryWrites=true&w=majority
```

No other database is supported or needed.

---

## 3. Environment variables

`.env.example` → `.env`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | HTTP port |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `TRUST_PROXY` | `1` | express `trust proxy` hop count |
| `BODY_LIMIT` | `1mb` | request body size cap |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/kinetic` | MongoDB connection string |
| `JWT_SECRET_ADMIN` | *(placeholder)* | **admin portal only**, min 32 chars |
| `JWT_SECRET_EMPLOYEE` | *(placeholder)* | **employee portal only**, min 32 chars |
| `JWT_SECRET_CUSTOMER` | *(placeholder)* | **customer portal only**, min 32 chars |
| `JWT_EXPIRES_IN` | `7d` | token lifetime |
| `JWT_COOKIE_DAYS` | `7` | cookie max age in days |
| `CLIENT_URL` | `http://localhost:5173` | the only allowed CORS origin |
| `SMTP_HOST` | *(empty)* | **empty ⇒ every email is printed to the console** |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` / `SMTP_PASS` | *(empty)* | SMTP credentials |
| `MAIL_FROM` | `KINETIC <no-reply@kinetic.local>` | From header |
| `COMPANY_INBOX` | `hello@kinetic.local` | notification inbox for new inquiries |
| `ADMIN_NAME` | `KINETIC Founder` | seed admin display name |
| `ADMIN_EMAIL` | `admin@kinetic.local` | seed admin login |
| `ADMIN_PASSWORD` | `ChangeMe#Admin2026` | seed admin password (**keep quoted**) |

`src/config/env.js` parses all of this with Zod at boot and exits with a readable message
if anything is missing or malformed.

Email behaviour: when `SMTP_HOST` is empty, `emailService.sendMail()` **logs the message to
the console and returns success** — it never throws, so development works without a mail
server. Inquiry emails failing never fails the HTTP request either.

---

## 4. Seed data

```powershell
npm run seed
```

Clears `users`, `projects`, `tasks`, `inquiries`, `tickets`, `leave requests`,
`announcements`, `invoices`, `messages` and `audit logs`, then rebuilds everything and
prints the credentials table.

**Credentials** (as printed by the seed):

| Portal | Login | Email | Password |
| --- | --- | --- | --- |
| Admin panel | `/api/v1/auth/admin/login` | `admin@kinetic.local` | `ChangeMe#Admin2026` |
| Employee 1 · KIN-EMP-001 | `/api/v1/auth/employee/login` | `ravi.tiwari@kinetic.local` | `Ravi@Employee2026` |
| Employee 2 · KIN-EMP-002 | `/api/v1/auth/employee/login` | `sana.qureshi@kinetic.local` | `Sana@Employee2026` |
| Employee 3 · KIN-EMP-003 | `/api/v1/auth/employee/login` | `imran.ansari@kinetic.local` | `Imran@Employee2026` |
| Customer 1 · Sunrise Retail Pvt Ltd | `/api/v1/auth/customer/login` | `priya@sunriseretail.in` | `Priya@Customer2026` |
| Customer 2 · Trinet Logistics | `/api/v1/auth/customer/login` | `vikram@trinetlogistics.in` | `Vikram@Customer2026` |

**Records created:** 6 users · 7 projects (featured **Project Apex** + LeadStream ERP Router,
CoreFabric Ledger Console, Horizon Digital Storefront, Omnisync Multi-Cloud Gateway,
Prayagraj Transit Sensor Network) · 18 tasks · 5 tickets ·
6 leave requests · 5 announcements · 6 invoices · 10 project messages · 10 inquiries ·
6 audit entries.

Only the admin account is created from `.env`. Employees are never self-registrable — an
admin creates them and the temporary password is emailed (console, if SMTP is empty).
Customers can self-register at `POST /api/v1/auth/customer/register`.

---

## 5. Roles and permissions

| Capability | admin | employee | customer | public |
| --- | :-: | :-: | :-: | :-: |
| `GET /health`, `GET /projects`, `GET /projects/:slug` | ✓ | ✓ | ✓ | ✓ |
| `POST /inquiries` | ✓ | ✓ | ✓ | ✓ |
| Create / edit / delete employees | ✓ | ✗ | ✗ | ✗ |
| Create / edit / delete customers | ✓ | ✗ | ✗ | ✗ |
| Create / edit / delete projects, publish, feature, order, assign, upload gallery | ✓ | ✗ | ✗ | ✗ |
| Create / edit / delete tasks | ✓ | ✗ | ✗ | ✗ |
| Create / edit / delete announcements, invoices | ✓ | ✗ | ✗ | ✗ |
| Inquiries: list, view, status, notes, delete | ✓ | ✗ | ✗ | ✗ |
| Tickets: list, view, reply, status | ✓ | reply/status only | own thread only | ✗ |
| Leave requests: list, approve / reject | ✓ | create / cancel own | ✗ | ✗ |
| Audit log viewer | ✓ | ✗ | ✗ | ✗ |
| Admin settings + admin profile | ✓ | ✗ | ✗ | ✗ |
| Own dashboard, profile, change password | ✓ | ✓ | ✓ | ✗ |
| Projects list | all | assigned only | own only | published only |
| Tasks | all | own only (status + comments) | ✗ | ✗ |
| Invoices | all | ✗ | own only | ✗ |
| Project messages | all | assigned projects only | own projects only | ✗ |
| Announcements | all | `all` + `employees` | `all` + `customers` | ✗ |

**Cross-portal results:** every `/api/v1/admin/*` route returns **401/403** to employees and
customers; `/api/v1/employee/*` returns 401/403 to customers and vice versa; a cookie from
one portal is rejected by `/auth/<other-role>/me`.

**Data isolation:** employee and customer controllers always filter by `req.user._id` in the
query. Ids coming from the request body are never trusted for ownership. Where a list is
scoped to the caller, the owner id is stripped from the response (`select('-customer')`).

---

## 6. Auth design

- **Three login endpoints**, each accepting only its own role and always answering with the
  same generic `Invalid credentials` (401) for wrong role, wrong password, inactive account
  or unknown email — no user enumeration.
- **Three httpOnly cookies**: `kinetic_admin`, `kinetic_employee`, `kinetic_customer`
  (`sameSite=lax`, `secure` in production, 7-day expiry, path `/`).
- **Three JWT secrets** — a token minted for one portal cannot be verified by another.
- `authenticate(role)` reads only that role's cookie; `requireRole(...roles)` double-checks.
- **Lockout:** 5 failed logins ⇒ account locked for 15 minutes.
- **Password reset** (`employee` / `customer`): raw token is generated once, only its hash is
  stored, 30-minute expiry, and the response is identical whether or not the email exists.
- **Change password** works even while `mustChangePassword` is set; a temporary employee
  password forces a change on first sign-in.
- **Audit:** every successful admin mutation is written to `AuditLog` (actor, action, entity,
  entityId, summary, ip, timestamp) by `middleware/auditLogger.js`.

---

## 7. Response shape

Every endpoint returns the same envelope:

```json
{ "success": true, "data": { }, "message": "Human readable summary" }
```

Errors:

```json
{ "success": false, "data": null, "message": "What went wrong", "code": "SOME_CODE" }
```

List endpoints accept `page`, `limit` (max 100), `q` and resource-specific filters, and
return:

```json
{ "success": true, "data": { "items": [], "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 1, "hasNext": false, "hasPrev": false } }, "message": "" }
```

---

## 8. Rate limits

| Limiter | Window | Max | Applied to |
| --- | --- | --- | --- |
| global | 15 min | 600 | every request |
| `authLimiter` | 15 min | 30 | the three login routes |
| `strictLimiter` | 60 min | 20 | register, forgot/reset password, change password |
| `inquiryLimiter` | 60 min | 8 | `POST /inquiries` |

Counters are in-memory, so restarting the server resets them.

---

## 9. API reference

Base URL: `http://localhost:5000/api/v1`
🔒 = requires that portal's cookie.

### 9.1 Health

| Method | Path | Access |
| --- | --- | --- |
| GET | `/health` | public |

### 9.2 Public website

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/projects` | public | published only · `category`, `featured`, `status`, `q`, `page`, `limit` |
| GET | `/projects/:slug` | public | by slug |
| POST | `/inquiries` | public | honeypot + strict rate limit · notifies `COMPANY_INBOX` + auto-reply |

### 9.3 Auth

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/auth/admin/login` | public | admin only |
| POST | `/auth/employee/login` | public | employee only |
| POST | `/auth/customer/login` | public | customer only |
| POST | `/auth/customer/register` | public | customers self-register; employees cannot |
| POST | `/auth/:role/forgot-password` | public | `:role` = `employee` \| `customer` |
| POST | `/auth/:role/reset-password/:token` | public | hashed token, 30 min |
| POST | `/auth/admin/change-password` | 🔒 admin | |
| POST | `/auth/employee/change-password` | 🔒 employee | |
| POST | `/auth/customer/change-password` | 🔒 customer | |
| GET | `/auth/admin/me` | 🔒 admin | |
| GET | `/auth/employee/me` | 🔒 employee | |
| GET | `/auth/customer/me` | 🔒 customer | |
| POST | `/auth/admin/logout` | 🔒 admin | clears `kinetic_admin` |
| POST | `/auth/employee/logout` | 🔒 employee | clears `kinetic_employee` |
| POST | `/auth/customer/logout` | 🔒 customer | clears `kinetic_customer` |

### 9.4 Admin — `/admin/*` (🔒 admin only)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/stats` | dashboard counters |
| GET | `/admin/charts` | inquiries per week, projects by status |
| GET | `/admin/profile` | admin profile |
| PATCH | `/admin/profile` | edit name / phone / avatar |
| POST | `/admin/profile/change-password` | change password |
| GET | `/admin/settings` | platform settings |
| GET | `/admin/employees` | list · `q`, `role`, `isActive`, `department` |
| POST | `/admin/employees` | create (+ temp password email, `mustChangePassword`) |
| GET | `/admin/employees/:id` | read |
| PATCH | `/admin/employees/:id` | update |
| PATCH | `/admin/employees/:id/status` | activate / deactivate |
| POST | `/admin/employees/:id/reset-password` | issue new password |
| DELETE | `/admin/employees/:id` | delete |
| GET | `/admin/customers` | list |
| POST | `/admin/customers` | create |
| GET | `/admin/customers/:id` | read |
| PATCH | `/admin/customers/:id` | update |
| PATCH | `/admin/customers/:id/status` | activate / deactivate |
| POST | `/admin/customers/:id/reset-password` | issue new password |
| DELETE | `/admin/customers/:id` | delete |
| GET | `/admin/projects` | list · `q`, `category`, `status`, `published`, `featured`, `customer`, `employee` |
| POST | `/admin/projects` | create (slug auto-generated) |
| GET | `/admin/projects/:id` | read |
| PATCH | `/admin/projects/:id` | update |
| DELETE | `/admin/projects/:id` | delete |
| PATCH | `/admin/projects/:id/publish` | publish / unpublish |
| PATCH | `/admin/projects/:id/feature` | feature toggle |
| PATCH | `/admin/projects/:id/order` | ordering |
| PATCH | `/admin/projects/:id/progress` | 0–100 |
| PATCH | `/admin/projects/:id/assign` | assign customer + employees |
| POST | `/admin/projects/:id/gallery` | upload image (multer: type + size limits) |
| DELETE | `/admin/projects/:id/gallery` | remove image |
| GET | `/admin/tasks` | list · `q`, `status`, `priority`, `project`, `assignedTo` |
| POST | `/admin/tasks` | create |
| GET | `/admin/tasks/:id` | read |
| PATCH | `/admin/tasks/:id` | update (incl. reassign) |
| DELETE | `/admin/tasks/:id` | delete |
| GET | `/admin/inquiries` | list · `q`, `status`, `type` |
| GET | `/admin/inquiries/:id` | read |
| PATCH | `/admin/inquiries/:id/status` | new / contacted / closed |
| PATCH | `/admin/inquiries/:id/notes` | internal notes |
| DELETE | `/admin/inquiries/:id` | delete |
| GET | `/admin/tickets` | list · `q`, `status`, `priority`, `customer` |
| GET | `/admin/tickets/:id` | read thread |
| POST | `/admin/tickets/:id/reply` | reply |
| PATCH | `/admin/tickets/:id/status` | open / in-progress / resolved |
| GET | `/admin/leave-requests` | list · `q`, `status`, `type`, `employee` |
| PATCH | `/admin/leave-requests/:id/approve` | approve + note |
| PATCH | `/admin/leave-requests/:id/reject` | reject + note |
| GET | `/admin/announcements` | list · `q`, `audience` |
| POST | `/admin/announcements` | create (audience: all / employees / customers) |
| GET | `/admin/announcements/:id` | read |
| PATCH | `/admin/announcements/:id` | update |
| DELETE | `/admin/announcements/:id` | delete |
| GET | `/admin/invoices` | list · `q`, `status`, `customer`, `project` |
| POST | `/admin/invoices` | create (number auto: `KIN-INV-YYYY-0001`) |
| GET | `/admin/invoices/:id` | read |
| PATCH | `/admin/invoices/:id` | update |
| PATCH | `/admin/invoices/:id/status` | pending / paid / overdue |
| DELETE | `/admin/invoices/:id` | delete |
| GET | `/admin/audit-logs` | audit viewer · `q`, `action`, `entity`, `actor` |

### 9.5 Employee — `/employee/*` (🔒 employee only, own data only)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/employee/stats` | open tasks, active projects, pending leave, new announcements |
| GET | `/employee/profile` | own profile |
| PATCH | `/employee/profile` | edit name / phone / avatar |
| POST | `/employee/profile/change-password` | change password |
| GET | `/employee/projects` | assigned projects only |
| GET | `/employee/projects/:id` | assigned project (404 otherwise) |
| GET | `/employee/projects/:id/messages` | thread for assigned project |
| POST | `/employee/projects/:id/messages` | post message |
| GET | `/employee/tasks` | own tasks only |
| GET | `/employee/tasks/:id` | own task (404 otherwise) |
| PATCH | `/employee/tasks/:id/status` | todo / in-progress / review / done |
| POST | `/employee/tasks/:id/comments` | add comment |
| GET | `/employee/leaves` | own leave requests |
| POST | `/employee/leaves` | raise request |
| GET | `/employee/leaves/:id` | own request |
| PATCH | `/employee/leaves/:id/cancel` | cancel while pending |
| GET | `/employee/announcements` | audience `all` or `employees` |
| GET | `/employee/announcements/:id` | read |

### 9.6 Customer — `/customer/*` (🔒 customer only, own data only)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/customer/stats` | active projects, open tickets, pending invoices, latest announcement |
| GET | `/customer/profile` | own profile |
| PATCH | `/customer/profile` | edit name / phone / avatar / companyName |
| POST | `/customer/profile/change-password` | change password |
| GET | `/customer/projects` | own projects with progress + timeline |
| GET | `/customer/projects/:id` | own project (404 otherwise) |
| GET | `/customer/projects/:id/messages` | thread for own project |
| POST | `/customer/projects/:id/messages` | post message |
| GET | `/customer/tickets` | own tickets |
| POST | `/customer/tickets` | open ticket |
| GET | `/customer/tickets/:id` | own thread (404 otherwise) |
| POST | `/customer/tickets/:id/reply` | reply on own ticket |
| GET | `/customer/invoices` | own invoices + status totals |
| GET | `/customer/invoices/:id` | own invoice (404 otherwise) |
| GET | `/customer/announcements` | audience `all` or `customers` |
| GET | `/customer/announcements/:id` | read |

---

## 10. Security checklist

- `helmet` headers, `cors` locked to `CLIENT_URL` with `credentials: true`
- `compression`, `morgan` access logs
- `express-mongo-sanitize` (no `$`/`.` operators from user input), `hpp` (parameter pollution)
- `trust proxy` from `TRUST_PROXY`, body size limited by `BODY_LIMIT`
- Zod validation on **every** write route and on list/params queries
- bcrypt cost 12, generic auth errors, account lockout, hashed reset tokens
- Custom `ApiError` + `asyncHandler`, centralized `errorHandler`
  (no stack traces when `NODE_ENV=production`) and a JSON `notFound` handler

---

## 11. Smoke test (PowerShell)

```powershell
# health
Invoke-RestMethod http://localhost:5000/api/v1/health

# admin sign-in (keeps the cookie in $s)
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Uri http://localhost:5000/api/v1/auth/admin/login -Method Post `
  -Body (@{ email = 'admin@kinetic.local'; password = 'ChangeMe#Admin2026' } | ConvertTo-Json) `
  -ContentType 'application/json' -WebSession $s -UseBasicParsing

# admin dashboard
Invoke-RestMethod http://localhost:5000/api/v1/admin/stats -WebSession $s -UseBasicParsing

# an employee must be rejected by the admin endpoint
try {
  Invoke-RestMethod -Uri http://localhost:5000/api/v1/auth/admin/login -Method Post `
    -Body (@{ email = 'ravi.tiwari@kinetic.local'; password = 'Ravi@Employee2026' } | ConvertTo-Json) `
    -ContentType 'application/json' -UseBasicParsing
} catch { $_.Exception.Message }   # Invalid credentials
```

---

## 12. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `EADDRINUSE: :::5000` | another process holds port 5000 → `Get-NetTCPConnection -LocalPort 5000` then `Stop-Process -Id <pid> -Force` |
| `MONGO_URI is required` / connect timeout | start local `mongod`, or set an Atlas URI in `.env` |
| `Invalid environment configuration` | read the printed field list; values are Zod-validated at boot |
| Admin login always fails | check `ADMIN_PASSWORD` is quoted in `.env` if it contains `#` |
| Emails "missing" | `SMTP_HOST` empty ⇒ mails are printed to the console on purpose |
| `429 Too many requests` | in-memory limiter → restart the server to reset counters |
| Frontend gets CORS errors | frontend must run on `CLIENT_URL` (`http://localhost:5173`) with credentials |
