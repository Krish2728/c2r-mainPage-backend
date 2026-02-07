# Connect2Roots Admin Backend

Node.js + Express + PostgreSQL backend for the Connect2Roots website. It receives contact form submissions (emails), partnership inquiries, mentor applications, and donations. Admin dashboard API lets you list all emails and donations.

## Setup

1. **PostgreSQL**: Create a database, e.g. `c2r_admin`.
2. **Env**: Copy `.env.example` to `.env` and set:
   - `DATABASE_URL=postgresql://user:password@localhost:5432/c2r_admin`
   - `JWT_SECRET` (strong random string)
   - `CORS_ORIGIN=http://localhost:5173` (your React app URL)
   - Optional: `FRONTEND_URL`, `PORT`
3. **Install & init DB**:
   ```bash
   npm install
   npm run init-db
   ```
4. **Run**:
   ```bash
   npm run dev
   ```

Default admin: **admin@connect2roots.org** / **admin123** (change in production.)

**Admin dashboard (HTML):** After starting the server, open **http://localhost:4000/admin.html** to log in and view all emails (contact, partnership, mentor applications) and donations.

## API

### Public (no auth)

- **POST /api/contact** – General contact form  
  Body: `{ name, email, message }`
- **POST /api/partnership** – Partnership inquiry  
  Body: `{ companyName, contactPerson, email, message }`
- **POST /api/mentor-application** – Mentor application  
  Body: `{ name, email, profession, experience, motivation }`
- **POST /api/donations** – Create donation (records intent, returns checkout URL)  
  Body: `{ amount }` (paise), `{ donorName, donorEmail }`  
  Response: `{ donationId, checkoutUrl, donation }`
- **PATCH /api/donations/:id/complete** – Mark donation completed (e.g. after payment webhook)

### Admin (Bearer token required)

- **POST /api/admin/login** – Body: `{ email, password }` → `{ token, admin }`
- **GET /api/admin/emails** – List contact submissions. Query: `type`, `limit`, `offset`
- **GET /api/admin/donations** – List donations. Query: `status`, `limit`, `offset`
- **GET /api/admin/stats** – Dashboard stats: total emails, donation count, total donation amount

## Donations template (database)

Donations are stored in the `donations` table:

| Column           | Type     | Description                    |
|------------------|----------|--------------------------------|
| id               | SERIAL   | Primary key                    |
| amount_paise     | BIGINT   | Amount in paise (e.g. 50000)   |
| amount_display   | DECIMAL  | Amount in rupees (e.g. 500.00) |
| donor_name       | VARCHAR  | Donor name                     |
| donor_email      | VARCHAR  | Donor email                    |
| status           | VARCHAR  | pending, completed, failed     |
| payment_session_id | VARCHAR | External payment session ID    |
| payment_provider | VARCHAR  | e.g. stripe, razorpay          |
| created_at       | TIMESTAMPTZ | When record was created    |
| completed_at     | TIMESTAMPTZ | When payment completed      |

Use **PATCH /api/donations/:id/complete** when your payment gateway confirms payment (or manually in admin).
