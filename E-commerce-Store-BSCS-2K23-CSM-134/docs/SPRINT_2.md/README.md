# Mobile Store E-Commerce System — Sprint 2

Catalog Data Foundation built from the Sprint 1 architecture.

## Stack
- Node.js + Express.js
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- Jest + Supertest

Sprint 1 selected React.js for frontend, Node.js/Express.js for backend and PostgreSQL for relational persistence. Redis was optional. Sprint 2 implements the backend catalog foundation using that stack.

## Sprint 2 scope
Implemented:
- Category tree with stable slugs and cycle prevention
- Product CRUD/deactivation
- Variants using JSONB option values
- SKUs with unique codes, decimal prices and non-negative stock
- Authenticated administrator routes
- Database constraints and foreign keys
- Seed data
- Automated validation and authorization tests
- Sprint 2 documentation and Mermaid ERD

Out of scope: public catalog search, dynamic specification workflows, asset upload, payments, order placement, shipping and complete checkout.

## Requirements
- Node.js 18+
- Docker Desktop (recommended for PostgreSQL) or PostgreSQL 14+

## Local setup

```bash
npm install
cp .env.example .env
```

Start PostgreSQL:

```bash
docker compose up -d
```

Run migrations:

```bash
npm run migrate
```

Seed demonstration data:

```bash
npm run seed
```

Start server:

```bash
npm start
```

Health check: `GET http://localhost:5000/health`

## Demo admin credentials

Email: `admin@mobilestore.local`
Password: `Admin@12345`

These are development-only seed credentials. Change them for any real deployment.

## Tests

Basic tests:

```bash
npm test
```

Database reachability test after PostgreSQL/migrations:

```bash
RUN_DB_TESTS=true npm test
```

## API authentication

Login:

```http
POST /api/v1/auth/login
Content-Type: application/json

{"email":"admin@mobilestore.local","password":"Admin@12345"}
```

Use the returned JWT:

```http
Authorization: Bearer <token>
```

## Main admin routes

- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PATCH /api/v1/admin/categories/:id`
- `DELETE /api/v1/admin/categories/:id` — soft deactivation
- `GET /api/v1/admin/products`
- `POST /api/v1/admin/products`
- `PATCH /api/v1/admin/products/:id`
- `DELETE /api/v1/admin/products/:id` — soft deactivation
- `POST /api/v1/admin/products/:id/variants`
- `POST /api/v1/admin/products/:id/skus`
- `PATCH /api/v1/admin/skus/:id`
- `DELETE /api/v1/admin/skus/:id` — deactivation

## Notes on Sprint 1 integration
Sprint 1 placed price and stock directly on Products. Sprint 2 moves sellable price and inventory meaning to SKU, as required by the Sprint 2 catalog model. Product remains the catalog identity while Variant represents a valid option combination and SKU is the sellable inventory identity. The original Sprint 1 Users, Reviews, Orders, Order_Items, Carts and Cart_Items entities are preserved in the schema for later sprints.
