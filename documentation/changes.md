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

- To change behavior:
  - Replace in-memory arrays in `routes/products.js` and `routes/transactions.js` with a database (Sequelize is already in `package.json`).
  - Update `middlewares/auth.js` to integrate real authentication and role lookup (e.g., verify JWT and load user role).
  - Frontend files are simple and meant as mockups; edit `public/html/home.html` and `public/js/home.js` to adapt the UI.
