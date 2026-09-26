# StockSense Backend

Node.js + Express + PostgreSQL backend for the StockSense Inventory Management System.

## 1. Folder structure

```
backend/
├── package.json
├── .env.example
├── .gitignore
└── src/
    ├── config/db.js
    ├── controllers/        (authController, productController, warehouseController,
    │                         receiptController, deliveryController, transferController,
    │                         adjustmentController, ledgerController, dashboardController)
    ├── routes/              (one file per controller above)
    ├── services/stockService.js
    ├── middleware/authMiddleware.js, errorMiddleware.js
    ├── validators/authValidator.js, productValidator.js, operationValidator.js
    ├── models/.gitkeep      (raw SQL is used instead of an ORM - see note below)
    ├── app.js
    └── server.js

database/
├── schema.sql
└── seed.sql
```

## 2. Installation

```bash
cd backend
npm install
cp .env.example .env
# then fill in .env - see section 5 below
```

## 3. Database setup

1. Create a PostgreSQL database, e.g.:
   ```bash
   createdb stocksense
   ```
2. Run the schema:
   ```bash
   psql "$DATABASE_URL" -f ../database/schema.sql
   ```
3. (Optional) Load demo data:
   ```bash
   psql "$DATABASE_URL" -f ../database/seed.sql
   ```
   The seed script creates 2 demo users (password `Password123` for both),
   2 warehouses with locations, 3 products, and initial stock.

## 4. Start the backend

```bash
npm run dev     # nodemon, auto-restart on changes
# or
npm start       # plain node
```

The API is served at `http://localhost:5000` by default (see `PORT` in `.env`).
`GET /health` can be used as a liveness check.

## 5. `.env` explanation

| Variable          | Meaning                                                            |
|-------------------|---------------------------------------------------------------------|
| `PORT`            | Port the Express server listens on                                  |
| `NODE_ENV`        | `development` or `production`                                       |
| `DATABASE_URL`    | PostgreSQL connection string                                        |
| `JWT_SECRET`      | Secret used to sign JWTs - use a long random string                 |
| `JWT_EXPIRES_IN`  | Token lifetime, e.g. `7d`                                            |
| `EMAIL_HOST/PORT` | SMTP server used by Nodemailer to send OTP emails                   |
| `EMAIL_USER`      | SMTP username / sender address                                      |
| `EMAIL_PASSWORD`  | SMTP password / app password                                        |
| `CORS_ORIGIN`     | Comma-separated list of allowed frontend origins, or `*`             |

No real secrets are committed anywhere in this repo - `.env` is git-ignored.

## 6. API endpoints

**Auth** (`/api/auth`)
```
POST   /signup
POST   /login
POST   /forgot-password
POST   /verify-otp
POST   /reset-password
POST   /logout            (protected)
GET    /profile           (protected)
PUT    /profile           (protected)
```

**Products** (`/api/products`, all protected)
```
GET    /                  ?q=<name or sku>&category=<name>
GET    /:id
POST   /
PUT    /:id
DELETE /:id
```

**Warehouses** (`/api/warehouses`, all protected)
```
GET    /
GET    /:id
POST   /                  body may include locations: [{ name }]
PUT    /:id
DELETE /:id
```

**Receipts** (`/api/receipts`, all protected)
```
GET    /                  ?status=&warehouseId=
GET    /:id
POST   /
PUT    /:id
DELETE /:id
POST   /:id/validate
```

**Deliveries** (`/api/deliveries`, all protected) - same shape as receipts.

**Transfers** (`/api/transfers`, all protected) - same shape as receipts.

**Adjustments** (`/api/adjustments`, all protected)
```
GET    /                  ?status=&warehouseId=
GET    /:id
POST   /
POST   /:id/validate
```

**Ledger** (`/api/ledger`, all protected)
```
GET    /                  ?movementType=&warehouseId=&from=&to=
GET    /:productId
```

**Dashboard** (`/api/dashboard`, protected)
```
GET    /                  ?warehouseId=&category=
```

All responses follow:
```json
{ "success": true,  "message": "...", "data": { } }
{ "success": false, "message": "..." }
```

## 7. Example requests

**Signup**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Rao","email":"asha@example.com","password":"Password123","role":"inventory_manager"}'
```

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com","password":"Password123"}'
```
Response includes `data.token` - send it as `Authorization: Bearer <token>` on every other request.

**Create a receipt**
```bash
curl -X POST http://localhost:5000/api/receipts \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{
    "supplierName": "ABC Steel Suppliers",
    "warehouseId": "<warehouse-uuid>",
    "locationId": "<location-uuid>",
    "items": [{ "productId": "<product-uuid>", "quantity": 50 }]
  }'
```

**Validate the receipt (stock increases here, not on create)**
```bash
curl -X POST http://localhost:5000/api/receipts/<receipt-id>/validate \
  -H "Authorization: Bearer <token>"
```

## 8. How stock changes

All of the below run inside a single PostgreSQL transaction (`BEGIN` ... `COMMIT`,
with `ROLLBACK` on any error), implemented in `services/stockService.js` and
called from each controller's `validate*` action:

- **Receipt validate**: for each item, stock at (product, warehouse, location)
  increases by the received quantity; a `RECEIPT` ledger row is written;
  the receipt is marked `done`.
- **Delivery validate**: for each item, stock decreases by the delivered
  quantity. If that would take stock below 0, the whole transaction is
  rolled back and a 400 error is returned - stock never goes negative.
  A `DELIVERY` ledger row is written; the delivery is marked `done`.
- **Transfer validate**: for each item, stock decreases at the source
  location and increases at the destination location, inside the same
  transaction, so company-wide total stock for that product is unchanged.
  One `TRANSFER` ledger row per item records both sides.
- **Adjustment validate**: for each item, stock is set directly to the
  counted quantity. The signed difference (counted − system) is written
  as an `ADJUSTMENT` ledger row so shrinkage/overage is traceable.

Every one of these paths uses `SELECT ... FOR UPDATE` on the relevant stock
row before changing it, so concurrent requests touching the same stock
row are serialized instead of racing.

## 9. Connecting a frontend

1. Point the frontend's API base URL at `http://localhost:5000/api` (or your
   deployed URL).
2. After `/auth/login` or `/auth/signup`, store the returned `token`
   (e.g. in memory or `httpOnly` storage handled by your frontend framework)
   and send it as `Authorization: Bearer <token>` on every subsequent request.
3. All list endpoints return arrays under `data`; all single-resource
   endpoints return an object under `data`. Errors always come back as
   `{ success: false, message }` with an appropriate HTTP status code, so
   the frontend can branch on `success` alone.
4. `CORS_ORIGIN` in `.env` must include the frontend's origin (e.g.
   `http://localhost:3000`) or the browser will block requests.

## 10. Assumptions made

- **`models/` is intentionally empty** (`.gitkeep` only): the project uses
  raw parameterized SQL via the `pg` driver rather than an ORM, per the
  "Do not put all logic into one file" / layered-architecture requirement.
  If you'd prefer a query-builder or ORM layer (e.g. Knex, Prisma), that
  would replace this folder's contents - flag it and it can be added.
- **Low-stock threshold** is a flat constant (`10` units) in
  `dashboardController.js` rather than a per-product reorder point, to
  keep scope hackathon-sized. Swapping in a per-product threshold is a
  small schema + query change.
- **`GET /api/auth/profile` and `PUT /api/auth/profile`** were added
  under `/api/auth` to satisfy the "User Profile" feature, since the
  endpoint list in the spec didn't include an explicit path for it.
- **Roles** (`inventory_manager`, `warehouse_staff`) are stored and
  returned but no endpoint currently restricts actions by role - every
  authenticated user can perform every action. Role-based authorization
  can be added as a small extra check in `authMiddleware.js` if needed.
- **SMTP failures** during `forgot-password` are logged but do not fail
  the request (the API always responds success, to avoid leaking which
  emails are registered). Check server logs if OTP emails aren't arriving
  in local development.
- All IDs are UUIDs (`gen_random_uuid()`), generated via the `pgcrypto`
  extension, which `schema.sql` enables automatically.
