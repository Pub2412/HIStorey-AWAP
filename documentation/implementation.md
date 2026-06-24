Implementation notes

- Added a lightweight NodeJS REST API (in-memory) for `products` and `transactions` to allow quick testing without a database.
- Routes:
  - `GET /api/v1/products?q=...` - list products (supports search query param)
  - `GET /api/v1/products/:id` - single product
  - `POST /api/v1/products` - create product (requires admin header `x-user-role: admin`)
  - `PUT /api/v1/products/:id` - update product (admin)
  - `DELETE /api/v1/products/:id` - delete product (admin)

  - `GET /api/v1/transactions` - list transactions
  - `GET /api/v1/transactions/:id` - single transaction
  - `POST /api/v1/transactions` - create transaction (body: `email`, `total`, `items`)
  - `PUT /api/v1/transactions/:id` - update transaction (admin). If `sendEmail: true` in body and transaction has `email`, a receipt PDF will be generated and emailed (ethereal test account) and a preview URL is returned.

- Middleware: `middlewares/auth.js` implements `checkAdmin` (header `x-user-role: admin`) and `sendReceiptEmail()` which uses `nodemailer` + `pdfkit` and Ethereal for test emails.

- Frontend mockup: `public/html/home.html` and `public/js/home.js` implement:
  - Search/autocomplete calling `GET /api/v1/products?q=` (Quiz 5)
  - Products datatable with CRUD buttons (admin header required) (MP4)
  - Transaction create form to POST transactions (Term Test)

- Notes:
  - Data is in-memory: server restart clears data. This keeps the mock simple and easy to test in Insomnia.
  - After pulling changes, run `npm install` to install `pdfkit` (and existing deps) before starting.
