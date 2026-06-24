Insomnia / API testing instructions

Base URL: http://localhost:3000

1) Start server

```powershell
npm install
npm start
```

2) Products

- List all: `GET /api/v1/products`
- Search/autocomplete: `GET /api/v1/products?q=searchterm`
- Create (admin): `POST /api/v1/products` body JSON `{ "name": "Hat", "price": 120 }` and add header `x-user-role: admin`
- Update (admin): `PUT /api/v1/products/:id` body JSON `{ "name": "New name" }` and header `x-user-role: admin`
- Delete (admin): `DELETE /api/v1/products/:id` with header `x-user-role: admin`

3) Transactions

- Create: `POST /api/v1/transactions` body JSON `{ "email": "you@example.com", "total": 300, "items": [] }`
- Update (admin + send email): `PUT /api/v1/transactions/:id` body JSON `{ "status": "shipped", "sendEmail": true }` and header `x-user-role: admin`

When `sendEmail` is true and the transaction has an `email`, the server will generate a PDF receipt and send it via Mailtrap if Mailtrap env vars are set, otherwise it will use an Ethereal test account. The response includes a `preview` URL (Ethereal) or Mailtrap will capture the message in your Mailtrap inbox.

To use Mailtrap, create a `.env` file from `.env.example` and fill in your Mailtrap SMTP credentials, then restart the server.
