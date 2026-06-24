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

- To change behavior:
  - Replace in-memory arrays in `routes/products.js` and `routes/transactions.js` with a database (Sequelize is already in `package.json`).
  - Update `middlewares/auth.js` to integrate real authentication and role lookup (e.g., verify JWT and load user role).
  - Frontend files are simple and meant as mockups; edit `public/html/home.html` and `public/js/home.js` to adapt the UI.
