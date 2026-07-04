06/24/2026 

HEE HEE
OWWWWWW

- Files added/modified:
  - Modified: `app.js` to mount APIs and serve `public/html/home.html`
  - Added: `routes/products.js`, `routes/transactions.js`
  - Modified: `middlewares/auth.js` implemented role-check and email helper
  - Added: frontend mock `public/html/home.html`, `public/js/home.js`
  - Added: `documentation/implementation.md`, `documentation/insomnia_instructions.md`
  - Updated `package.json` to add `pdfkit`

- 06/24/2026 login page update:
  - Added: `public/html/login.html` as the new default landing page
  - Added: `public/js/login.js` for functional login/register behavior with localStorage session state
  - Added: `public/css/login.css` for the dedicated mockup design
  - Modified: `app.js` to route `/` and `/login` to the new auth page and keep `/home` for the storefront mockup

- 06/24/2026 landing page routing update:
  - Modified: `app.js` so `/` serves `public/html/home.html` again
  - Kept: `public/html/login.html` available at `/login` as a separate auth entry point

- 06/24/2026 register page update:
  - Added: `public/html/register.html` as a dedicated register page
  - Added: `public/js/register.js` for jQuery-based registration behavior
  - Modified: `app.js` to serve `/register`

- Landing page: Added `public/html/landing.html` and `public/js/landing.js`. The landing page is now served at `/` (default page). It loads background audio `/media/songs/mj_landing.mp3` and images from `/media/images/`. A mute toggle stores preference in `localStorage`.

---

## 06/24/2026 — Database-backed auth (login & register)

### Backend
- **Added:** `models/user.js` — Sequelize model for the `users` table (`password_hash`, `role`, `active_token`, `is_active`, etc.)
- **Added:** `controllers/userController.js` — auth logic:
  - `register` — validate input, bcrypt hash, create user, JWT, save `active_token`
  - `login` — find user, compare password, JWT, save `active_token`
  - `logout` — clear `active_token`
  - `getMe` — validate session (JWT + DB `active_token` match)
  - `listUsers` — list active users
- **Modified:** `routes/user.js` — thin router only; maps endpoints to `userController` + `verifyToken` middleware
- **Modified:** `middlewares/auth.js` — added `signToken`, `verifyToken`, JWT config (`JWT_SECRET`, `JWT_EXPIRES_IN`)
- **Modified:** `.env.example` — added `DB_*` and `JWT_*` variables

### API endpoints (`/api/v1`)
| Method | Endpoint | Auth |
|--------|----------|------|
| `POST` | `/auth/register` | No |
| `POST` | `/auth/login` | No |
| `GET` | `/auth/me` | Bearer JWT |
| `POST` | `/auth/logout` | Bearer JWT |
| `GET` | `/users` | No |

### Frontend
- **Modified:** `public/js/login.js` — jQuery AJAX to auth API; session stored in `localStorage` (`historey.session`) with `token`, `name`, `email`, `role`
- **Modified:** `public/js/register.js` — jQuery AJAX to `/auth/register`
- **Fixed:** `public/html/login.html` — typo `ljabel` → `label`

---

## 06/24/2026 — Home page session UI

- **Modified:** `public/html/home.html` — `#authActions` container; `Add product` hidden by default
- **Modified:** `public/js/home.js`:
  - Signed out: show **Sign In** / **Register** links
  - Signed in: show user **name** + **Log out** button
  - Validates session via `GET /api/v1/auth/me`; stores `role` in `localStorage`
  - Logout calls `POST /api/v1/auth/logout` and refreshes header + products table

---

## 06/24/2026 — Login redirect to home

- **Modified:** `public/js/login.js` — after successful login, redirect to `/`
- **Modified:** `public/js/login.js` — if user visits `/login` with a valid session, redirect to `/` instead of showing signed-in view on login page

---

## 06/24/2026 — Admin-only product actions on home

- **Modified:** `public/js/home.js` — only users with `role === 'admin'` see:
  - **Add product** button
  - **Actions** column (Edit / Delete) in the products DataTable
- Customers and signed-out users see ID, Name, Price only
- Table re-initializes on auth state change (login/logout)

---

## 06/24/2026 — Removed demo / in-memory auth

- **Modified:** `controllers/userController.js` — removed `demoUsers` array, `ensureDemoUsers()` seeding, and in-memory fallback; auth requires MySQL (returns `503` if DB unavailable)
- **Modified:** `public/html/login.html` — removed demo account button, demo copy, and demo placeholders
- **Modified:** `public/html/register.html` — removed sample-values button and demo copy
- **Modified:** `public/js/login.js` — removed `fillDemoLogin` and demo user object
- **Modified:** `public/js/register.js` — removed `fillDemoRegister` and sample user object

---

## 06/24/2026 — jQuery Validation (login & register)

Replaced HTML5 validation (`required`, `type="email"`) with **jQuery Validation** plugin.

- **Added:** `public/js/auth-validation.js` — shared rules, messages, error placement, `initLoginValidator`, `initRegisterValidator`
- **Modified:** `public/html/login.html` — `novalidate` on forms; removed `required`; CDN for `jquery.validate.min.js`
- **Modified:** `public/html/register.html` — same as login page
- **Modified:** `public/js/login.js` — AJAX runs in validation `submitHandler`; removed manual `if` checks on register tab
- **Modified:** `public/js/register.js` — same pattern
- **Modified:** `public/css/login.css` — `.field-error` and `.input-error` styles

### Validation rules
| Field | Rules |
|-------|--------|
| Email | Required, valid email |
| Password | Required, min 8 characters |
| Name (register) | Required, min 2 characters |
| Confirm password | Must match password in same form |
| Terms (register) | Required checkbox |

---

## Still to do (from project plan)

- Replace in-memory arrays in `routes/products.js` and `routes/transactions.js` with full Sequelize CRUD (`productController`, `transactionController`)
- Protect product CRUD API with JWT role middleware (Quiz 6) instead of `x-user-role` header
- MP6: admin update user role, deactivate users, list users on DataTable
- Replace placeholder admin bcrypt hash in `database/hstore_db.sql` with a real hash for seeded admin login

---

## 07/01/2026 — Admin dashboard and management pages

### Admin experience
- Added a dedicated admin landing page at `/admin` and `/admin/dashboard` served from `public/html/admin/dashboard.html`
- Built a placeholder-ready admin dashboard with:
  - summary cards for total sales, active users, total products, and pending orders
  - a revenue trend line chart
  - a user-role distribution pie/doughnut chart with daily, weekly, monthly, and yearly range toggles
  - a top-selling items table
- Added admin navigation pages for:
  - users management at `/admin/users`
  - products management at `/admin/products`
  - orders management at `/admin/orders`

### Admin actions
- Added logout support from the admin dashboard that clears the stored session and redirects users back to the landing page
- Enabled admin CRUD-style product management from the products page, including create, edit, deactivate, and reactivate actions
- Expanded user management to support role updates, deactivation/reactivation, and creating new users from the admin users page
- Added order management UI backed by the existing transaction API

### Files added/updated
- Added: `public/html/admin/dashboard.html`
- Added: `public/html/admin/users.html`
- Added: `public/html/admin/products.html`
- Added: `public/html/admin/orders.html`
- Added: `public/js/admin-dashboard.js`
- Added: `public/js/user.js`
- Added: `public/js/admin-products.js`
- Added: `public/js/admin-orders.js`
- Updated: `app.js` to serve the new admin routes
- Updated: `routes/products.js` to support admin product deactivation/reactivation and protected product writes
- Updated: `controllers/userController.js` to allow admin-created users to be assigned a role during registration

### Product backend fix
- I put the CRUD functions on the Product Controller
- Ensured Sequelize is used
- I added multiple image uploads for products.

### CRUD FIXES
- Used datatables and sequelize ORM 
- Added jquery validation
- Added product images to show on product table and can make one primary and removable one by one
- Showed stock on product datatable

