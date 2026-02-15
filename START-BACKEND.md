# Fix 404 on /api/admin/volunteers

The admin dashboard at **http://localhost:4000/admin.html** needs **this** backend (c2r-admin-backend) running on port 4000.

If you see `GET http://localhost:4000/api/admin/volunteers 404`:

1. **Stop** whatever is currently running on port 4000 (close that terminal or Ctrl+C).
2. **Open a new terminal** and run from **this folder** (c2r-admin-backend):

   ```bash
   cd "c:\Users\krish\OneDrive\Desktop\new folder c2r\c2r-admin-backend"
   npm start
   ```
   Or: `npm run dev` (with nodemon for auto-restart).

3. When it starts, you should see in the console:
   - `GET /api/admin/volunteers` in the Admin line.
   - `→ Open http://localhost:4000/admin.html for the admin dashboard`

4. Open **http://localhost:4000/admin.html** again. The Volunteering tab should load without 404.

**Note:** If you run a different backend (e.g. Mentor-Mentee or mentoring Platform) on port 4000, it will not have this route. Use c2r-admin-backend for the admin portal.
