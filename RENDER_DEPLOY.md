# Deploy c2r-admin-backend on Render

Backend repo: [Krish2728/c2r-mainPage-backend](https://github.com/Krish2728/c2r-mainPage-backend)

## If Blueprint reports "there was an issue"

- The main `render.yaml` was updated: **releaseCommand** was removed (not a valid Blueprint field) and DB init runs in the start command instead.
- If you still see an error (e.g. about the database link), use **Option B** below (manual Web Service + PostgreSQL) or the fallback file **render.no-db.yaml**: copy it to `render.yaml`, then create a PostgreSQL instance in the Dashboard and set **DATABASE_URL** in the service Environment.

## Option A: Blueprint (recommended)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Blueprint**.
2. Connect your GitHub and select **Krish2728/c2r-mainPage-backend**.
3. Render will create:
   - A **Web Service** (this backend)
   - A **PostgreSQL** database (`c2r-admin-db`)
4. In the Web Service → **Environment**:
   - Set **CORS_ORIGIN** = your frontend URL, e.g. `https://c2r-mainpage.onrender.com` (no trailing slash). Add multiple origins comma-separated if needed.
   - **JWT_SECRET** is auto-generated; you can leave it or set your own.
5. Click **Apply** and wait for the first deploy. The **Release Command** (`npm run init-db`) runs automatically and creates tables + default admin.
6. Note your backend URL, e.g. `https://c2r-admin-backend.onrender.com`. Use it in the frontend as `VITE_API_URL`.

**Default admin:** `admin@connect2roots.org` / `admin123` (change in production.)

---

## Option B: Manual (Web Service + PostgreSQL)

1. **New +** → **PostgreSQL**. Create a DB (e.g. `c2r-admin-db`). Copy the **Internal Database URL**.
2. **New +** → **Web Service**. Connect repo **Krish2728/c2r-mainPage-backend**.
3. **Build**: `npm install`  
   **Start**: `node index.js`  
   **Release Command**: `npm run init-db`
4. **Environment**:
   - `DATABASE_URL` = (paste Internal Database URL)
   - `JWT_SECRET` = (generate a long random string)
   - `CORS_ORIGIN` = `https://your-frontend-url.onrender.com`
5. Deploy. After first deploy, run once in **Shell**: `npm run init-db` if you didn’t set Release Command.

---

## Free tier notes

- Backend and DB may spin down after inactivity; first request can be slow.
- Use the backend URL in the frontend **VITE_API_URL** (and in CORS_ORIGIN on the backend).
