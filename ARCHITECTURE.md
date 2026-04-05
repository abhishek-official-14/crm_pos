# Production-Ready CRM + POS Architecture (React + Node.js/Express + MongoDB)

## 0) Scope and Architectural Goals

This document defines a **production-ready, scalable architecture** for a combined CRM + POS platform with:

- Multi-role access (Admin, Staff)
- Real-time/near real-time sales workflows
- Customer lifecycle management
- Operational dashboards and reports
- Security-first API design
- Clean module boundaries to support team scaling

Primary quality attributes:

- **Scalability:** Horizontal API scaling, modular domain boundaries, index-aware MongoDB design.
- **Reliability:** Idempotent transactions where needed, robust validation, auditability.
- **Security:** JWT-based auth, password hashing, rate limiting, least privilege.
- **Maintainability:** Clean architecture foldering, clear contracts between frontend/backend.

---

## 1) Module Breakdown

## 1.1 POS Module

**Purpose:** Point-of-sale operations from cart to invoice to payment completion.

**Core capabilities:**

- Product search/browse by SKU/name/category
- Cart management (line item quantity, discounts, tax class)
- Price calculation (subtotal, GST, grand total)
- Multi-method payment capture (cash/card/UPI/wallet)
- Invoice generation (printable and downloadable)
- Returns/refunds with reference to original invoice
- Daily register/session open-close summaries

**Primary entities used:** Product, Inventory, Cart (ephemeral), Invoice, Payment, Store, Shift.

**Cross-module interactions:**

- Reads Auth for identity and role
- Writes sales data for Dashboard and Reports
- Updates CRM purchase history for customer profile

---

## 1.2 CRM Module

**Purpose:** Manage customer data, engagement, loyalty, and sales relationship history.

**Core capabilities:**

- Customer registration/profile management
- Contact and address management
- Loyalty points accrual/redemption
- Segmentation tags (VIP, wholesale, inactive, etc.)
- Customer timeline (purchases, notes, interactions)
- Optional lead/opportunity states for B2B workflows

**Primary entities used:** Customer, CustomerAddress, LoyaltyLedger, Interaction, Tag.

**Cross-module interactions:**

- POS writes purchase events and loyalty transactions
- Dashboard consumes CRM aggregates (repeat rate, CLV)
- Reports module uses CRM cohorts and conversion trends

---

## 1.3 Auth Module

**Purpose:** Authentication, authorization, identity/session management.

**Core capabilities:**

- Login/logout
- Token issuance (access + refresh)
- Role-based authorization (Admin/Staff)
- Permission policy checks at API and UI levels
- Password reset and credential lifecycle controls
- Optional device/session management

**Primary entities used:** User, Role, Permission, RefreshToken, AuthAudit.

**Cross-module interactions:**

- Required by all protected endpoints
- Provides user context for audit fields (`createdBy`, `updatedBy`, `cashierId`)

---

## 1.4 Dashboard Module

**Purpose:** Operational visibility for current business state.

**Core capabilities:**

- Today’s sales snapshots
- Orders count, average order value, returns
- Top products, low-stock alerts
- Staff performance counters
- Customer metrics (new vs repeat)

**Primary entities used:** Invoice, Payment, Product, Inventory, Customer.

**Cross-module interactions:**

- Read-optimized aggregation endpoints
- Cached/stateless queries for high-frequency reads

---

## 1.5 Reports Module

**Purpose:** Historical analytics, compliance reports, and export-ready datasets.

**Core capabilities:**

- Sales reports by period/store/staff/category
- Tax (GST) report and filing support
- Inventory movement and stock valuation reports
- Customer and loyalty reports
- Refund/void/discount audit reports

**Primary entities used:** Invoice, InvoiceItem, Payment, TaxSummary, InventoryTransaction, AuditLog.

**Cross-module interactions:**

- Pulls normalized and denormalized/aggregated data from POS and CRM domains
- Provides CSV/XLSX export endpoints

---

## 2) Database Schema (MongoDB) with Relationships

> Strategy: Use **normalized core collections** + **targeted denormalization snapshots** for performance.

## 2.1 Identity & Access Collections

### `users`
- `_id` (ObjectId)
- `fullName` (string)
- `email` (string, unique, lowercase)
- `phone` (string, unique, optional)
- `passwordHash` (string)
- `roleId` (ObjectId -> `roles._id`)
- `isActive` (boolean)
- `lastLoginAt` (date)
- `createdAt`, `updatedAt`

### `roles`
- `_id`
- `name` (enum: `ADMIN`, `STAFF`, unique)
- `description`
- `permissionIds` (ObjectId[] -> `permissions._id`)

### `permissions`
- `_id`
- `resource` (e.g., `invoice`, `customer`, `report`)
- `action` (e.g., `create`, `read`, `update`, `refund`, `export`)
- `key` (unique, e.g., `invoice.refund`)

### `refresh_tokens`
- `_id`
- `userId` (ObjectId -> users)
- `tokenHash` (string)
- `issuedAt`, `expiresAt`, `revokedAt`
- `deviceInfo`, `ipAddress`

### `auth_audit_logs`
- `_id`
- `userId`
- `eventType` (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `TOKEN_REFRESH`, etc.)
- `metadata`
- `createdAt`

---

## 2.2 Organization & Store Collections

### `stores`
- `_id`
- `name`
- `code` (unique)
- `address` (object)
- `timezone`
- `isActive`
- `createdAt`, `updatedAt`

### `store_users`
- `_id`
- `storeId` (ObjectId -> stores)
- `userId` (ObjectId -> users)
- `isPrimary` (boolean)
- Unique compound index: (`storeId`, `userId`)

### `shifts`
- `_id`
- `storeId`
- `cashierId` (user)
- `openedAt`, `closedAt`
- `openingFloat`, `closingCashExpected`, `closingCashActual`
- `status` (`OPEN`, `CLOSED`)

---

## 2.3 Product & Inventory Collections

### `categories`
- `_id`
- `name`
- `parentCategoryId` (nullable -> categories)
- `isActive`

### `products`
- `_id`
- `sku` (unique per store or global)
- `barcode` (indexed)
- `name`
- `description`
- `categoryId` (ObjectId -> categories)
- `brand`
- `unit` (e.g., `PCS`, `KG`)
- `price` (number/decimal)
- `costPrice` (number/decimal)
- `taxProfileId` (ObjectId -> tax_profiles)
- `isActive`
- `createdAt`, `updatedAt`

### `inventory`
- `_id`
- `productId` (ObjectId -> products)
- `storeId` (ObjectId -> stores)
- `quantityOnHand`
- `reorderLevel`
- `updatedAt`
- Unique compound index: (`productId`, `storeId`)

### `inventory_transactions`
- `_id`
- `productId`
- `storeId`
- `type` (`PURCHASE_IN`, `SALE_OUT`, `ADJUSTMENT`, `RETURN_IN`, `RETURN_OUT`)
- `quantity` (signed)
- `referenceType` (`INVOICE`, `PURCHASE_ORDER`, `ADJUSTMENT_NOTE`)
- `referenceId`
- `performedBy` (userId)
- `createdAt`

---

## 2.4 CRM Collections

### `customers`
- `_id`
- `customerCode` (unique)
- `firstName`, `lastName`
- `phone` (indexed)
- `email` (indexed)
- `dob` (optional)
- `gstin` (optional, for B2B)
- `tags` (string[] or tagIds)
- `loyaltyPointsBalance`
- `isActive`
- `createdAt`, `updatedAt`

### `customer_addresses`
- `_id`
- `customerId` (ObjectId -> customers)
- `type` (`BILLING`, `SHIPPING`, `HOME`, `WORK`)
- `line1`, `line2`, `city`, `state`, `country`, `postalCode`
- `isDefault`

### `customer_interactions`
- `_id`
- `customerId`
- `type` (`CALL`, `EMAIL`, `VISIT`, `NOTE`)
- `summary`
- `nextActionAt`
- `createdBy` (userId)
- `createdAt`

### `loyalty_ledger`
- `_id`
- `customerId`
- `invoiceId` (nullable)
- `pointsDelta` (+/-)
- `reason` (`PURCHASE`, `REDEMPTION`, `ADJUSTMENT`)
- `createdAt`

---

## 2.5 POS Sales Collections

### `invoices`
- `_id`
- `invoiceNumber` (unique, human-readable)
- `storeId`
- `shiftId`
- `cashierId` (user)
- `customerId` (nullable for walk-in)
- `status` (`DRAFT`, `PAID`, `PARTIALLY_PAID`, `VOID`, `REFUNDED`)
- `currency`
- `billingSnapshot` (embedded object)
- `pricing` (embedded totals object; see invoice structure)
- `notes`
- `issuedAt`, `createdAt`, `updatedAt`

### `invoice_items`
- `_id`
- `invoiceId` (ObjectId -> invoices)
- `productId` (ObjectId -> products)
- `skuSnapshot`
- `nameSnapshot`
- `unitPrice`
- `quantity`
- `discountType` (`PERCENT`, `AMOUNT`, `NONE`)
- `discountValue`
- `taxRate` (percent)
- `taxAmount`
- `lineSubtotal`
- `lineTotal`

### `payments`
- `_id`
- `invoiceId`
- `method` (`CASH`, `CARD`, `UPI`, `WALLET`, `BANK_TRANSFER`)
- `amount`
- `transactionRef` (for non-cash)
- `status` (`SUCCESS`, `FAILED`, `PENDING`, `REFUNDED`)
- `paidAt`
- `capturedBy` (userId)

### `refunds`
- `_id`
- `invoiceId`
- `invoiceItemId` (nullable for full refund)
- `amount`
- `reason`
- `refundMethod`
- `approvedBy` (userId)
- `createdAt`

---

## 2.6 Reporting/Audit Collections

### `audit_logs`
- `_id`
- `actorUserId`
- `resourceType`
- `resourceId`
- `action`
- `before` (object, optional)
- `after` (object, optional)
- `ipAddress`, `userAgent`
- `createdAt`

### `report_snapshots` (optional)
- `_id`
- `reportType`
- `parametersHash`
- `payload`
- `generatedAt`
- `expiresAt`

---

## 2.7 Key Relationships Summary

- `users.roleId -> roles._id`
- `roles.permissionIds[] -> permissions._id`
- `store_users.storeId -> stores._id`, `store_users.userId -> users._id`
- `products.categoryId -> categories._id`
- `products.taxProfileId -> tax_profiles._id` (if tax profile collection used)
- `inventory.productId -> products._id`, `inventory.storeId -> stores._id`
- `invoices.customerId -> customers._id`
- `invoice_items.invoiceId -> invoices._id`, `invoice_items.productId -> products._id`
- `payments.invoiceId -> invoices._id`
- `refunds.invoiceId -> invoices._id`
- `loyalty_ledger.customerId -> customers._id`, optional `invoiceId -> invoices._id`

---

## 3) REST API Endpoints (Request/Response Contracts)

> Base path: `/api/v1`

## 3.1 Auth

- `POST /auth/login`
  - Request: `{ emailOrPhone, password }`
  - Response: `{ accessToken, refreshToken, user: { id, fullName, role, permissions } }`
- `POST /auth/refresh`
  - Request: `{ refreshToken }`
  - Response: `{ accessToken, refreshToken }`
- `POST /auth/logout`
  - Request: `{ refreshToken }`
  - Response: `{ success: true }`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## 3.2 Users & Roles

- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `DELETE /users/:id` (soft delete)
- `GET /roles`
- `PATCH /roles/:id/permissions`

Common response envelope:

- Success: `{ success: true, data, meta? }`
- Error: `{ success: false, error: { code, message, details? } }`

## 3.3 CRM (Customers)

- `GET /customers?search=&page=&limit=&tag=`
- `POST /customers`
- `GET /customers/:id`
- `PATCH /customers/:id`
- `GET /customers/:id/interactions`
- `POST /customers/:id/interactions`
- `GET /customers/:id/loyalty-ledger`

Create customer request (example shape):

`{ firstName, lastName, phone, email, dob, addresses: [...], tags: [...] }`

Response:

`{ id, customerCode, firstName, lastName, phone, email, loyaltyPointsBalance, createdAt }`

## 3.4 Product & Inventory

- `GET /products?search=&categoryId=&isActive=&page=&limit=`
- `POST /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `GET /inventory?storeId=&lowStock=true`
- `POST /inventory/adjustments`

Inventory adjustment request:

`{ storeId, productId, quantityDelta, reason, note }`

## 3.5 POS (Cart/Invoice/Payments)

- `POST /pos/invoices`
  - Create invoice with items and optional customer
- `GET /pos/invoices/:id`
- `GET /pos/invoices?from=&to=&storeId=&cashierId=&status=`
- `POST /pos/invoices/:id/payments`
- `POST /pos/invoices/:id/void`
- `POST /pos/invoices/:id/refunds`

Create invoice request:

`{
  storeId,
  shiftId,
  customerId?,
  items: [
    { productId, quantity, discountType, discountValue }
  ],
  invoiceLevelDiscountType?,
  invoiceLevelDiscountValue?,
  notes?
}`

Create invoice response:

`{
  id,
  invoiceNumber,
  status,
  items: [...],
  pricing: {
    subtotal,
    itemDiscountTotal,
    invoiceDiscountTotal,
    taxableAmount,
    gstTotal,
    grandTotal,
    roundOff,
    amountPaid,
    amountDue
  },
  issuedAt
}`

Add payment request:

`{ method, amount, transactionRef? }`

Add payment response:

`{ invoiceId, paymentId, paymentStatus, amountPaid, amountDue, invoiceStatus }`

## 3.6 Dashboard & Reports

- `GET /dashboard/summary?storeId=&date=`
- `GET /dashboard/sales-trend?storeId=&from=&to=&bucket=day|week|month`
- `GET /reports/sales?from=&to=&storeId=&cashierId=&format=json|csv`
- `GET /reports/gst?from=&to=&storeId=&format=json|csv`
- `GET /reports/inventory-movement?from=&to=&storeId=&productId=`
- `GET /reports/customer-insights?from=&to=&segment=`

---

## 4) Scalable Folder Structure (Clean Architecture)

## 4.1 Monorepo Layout

`/apps`
- `web` (React + Vite)
- `api` (Node.js + Express)

`/packages`
- `shared-types` (DTO contracts, enums)
- `eslint-config`
- `tsconfig`
- `ui` (optional shared components)

`/infra`
- `docker`
- `k8s` (optional)
- `scripts`

---

## 4.2 Backend (`apps/api`) Structure

- `src/main` (bootstrap: server, app wiring)
- `src/config` (env, logger, db, constants)
- `src/modules`
  - `auth`
    - `domain` (entities, value objects, interfaces)
    - `application` (use-cases/services)
    - `infrastructure` (mongoose models/repositories)
    - `presentation` (controllers/routes/validators)
  - `crm` (same layering)
  - `pos` (same layering)
  - `dashboard` (query services)
  - `reports` (aggregations/export)
- `src/common`
  - `middlewares` (auth, error handler, rate limiter)
  - `utils`
  - `errors`
  - `types`
- `tests`
  - `unit`
  - `integration`
  - `e2e`

Design rules:

- `presentation -> application -> domain`
- `infrastructure` implements domain/application interfaces
- No direct controller-to-model coupling

---

## 4.3 Frontend (`apps/web`) Structure

- `src/app` (router, providers, app shell)
- `src/modules`
  - `auth`
  - `crm`
  - `pos`
  - `dashboard`
  - `reports`
  Each module contains:
  - `pages`
  - `components`
  - `hooks`
  - `services` (API clients)
  - `schemas` (form validation)
  - `state` (store/slices)
- `src/shared`
  - `ui`
  - `lib`
  - `constants`
  - `types`

---

## 5) User Roles and Permissions

## 5.1 Roles

### Admin

- Full access across all modules
- Manage users/roles/permissions
- Override discounts/refunds beyond staff thresholds
- Access all reports (including financial/tax exports)
- Configure tax rates, store settings, and product catalog

### Staff

- POS operations: create invoices, accept payments
- View/edit basic customer profiles
- Limited product/inventory view (and optionally low-risk adjustments)
- Limited dashboard visibility (own store/shift)
- No user management or permission management
- Refund/void only within policy limits (time/value cap), or requires Admin approval

## 5.2 Suggested Permission Matrix (Examples)

- `invoice.create` -> Admin, Staff
- `invoice.void` -> Admin, Staff (restricted)
- `invoice.refund` -> Admin, Staff (restricted)
- `customer.create/read/update` -> Admin, Staff
- `user.manage` -> Admin only
- `role.manage` -> Admin only
- `report.view_basic` -> Admin, Staff (filtered)
- `report.export_financial` -> Admin only
- `settings.tax.manage` -> Admin only

---

## 6) Invoice Structure (Fields, GST, Totals)

## 6.1 Header

- `invoiceNumber`
- `issuedAt`
- `store` snapshot (name, GSTIN, address)
- `cashier` snapshot
- `customer` snapshot (optional for walk-in)
- `status`

## 6.2 Line Items

Per item:

- `productId`
- `skuSnapshot`, `nameSnapshot`
- `quantity`
- `unitPrice`
- `lineSubtotal = quantity * unitPrice`
- `discountType` + `discountValue`
- `lineDiscountAmount`
- `taxableValue = lineSubtotal - lineDiscountAmount`
- `gstRate` (e.g., 5/12/18/28)
- `gstAmount = taxableValue * gstRate/100`
- `lineTotal = taxableValue + gstAmount`

## 6.3 Totals Section

- `subtotal` (sum of lineSubtotal)
- `itemDiscountTotal`
- `invoiceDiscountTotal`
- `taxableAmount`
- `gstBreakup` (by GST slab)
- `gstTotal`
- `roundOff`
- `grandTotal`
- `amountPaid`
- `amountDue`
- `paymentStatus`

## 6.4 GST Breakdown Object (Example)

- `gstBreakup: [ { rate: 5, taxableAmount: X, taxAmount: Y }, ... ]`

For intra-state billing, split into CGST/SGST; for inter-state, IGST.
Store both normalized values and a presentation-ready tax summary snapshot for compliance exports.

---

## 7) Validation Rules (Frontend + Backend)

## 7.1 Cross-cutting Principles

- Frontend validation for UX; backend validation is authoritative.
- Same schema contract (shared DTO/spec) to reduce drift.
- Reject unknown fields on sensitive endpoints.

## 7.2 Auth/User Validation

- Email format + lowercase normalization
- Phone format by country rules
- Password policy (min length, complexity, breach checks optional)
- Role assignment only by Admin

## 7.3 Product/Inventory Validation

- SKU required, unique
- Price/cost non-negative; cost <= max threshold
- Quantity changes signed and reason-mandatory for adjustments
- Prevent negative inventory unless explicit backorder policy

## 7.4 Customer Validation

- At least one unique contact channel (phone or email)
- Optional GSTIN format validation for business customers
- DOB cannot be future date

## 7.5 POS/Invoice Validation

- Invoice requires at least 1 valid item
- Quantity must be > 0
- Discount caps enforced by role and config
- Payment amount > 0
- Sum(payment amounts) <= grandTotal (unless overpayment flow exists)
- Refund amount cannot exceed refundable balance
- Idempotency key required on payment capture and refund endpoints

---

## 8) Environment Variables (.env)

## 8.1 API Service

- `NODE_ENV` (`development|staging|production`)
- `PORT`
- `API_BASE_URL`
- `MONGO_URI`
- `MONGO_DB_NAME`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL` (e.g., `15m`)
- `JWT_REFRESH_TTL` (e.g., `30d`)
- `BCRYPT_ROUNDS` (e.g., `12`)
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `CORS_ALLOWED_ORIGINS`
- `LOG_LEVEL`
- `REDIS_URL` (recommended for rate limiting/token revocation/cache)
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `TRUST_PROXY`

## 8.2 Web Service

- `VITE_API_BASE_URL`
- `VITE_APP_ENV`
- `VITE_SENTRY_DSN` (optional)
- `VITE_FEATURE_FLAGS` (optional)

Operational guidance:

- Separate env files per environment.
- Never commit secrets.
- Rotate JWT secrets and DB credentials periodically.

---

## 9) Security Practices

## 9.1 Authentication & Tokens

- Short-lived access token + long-lived rotating refresh token
- Store refresh token hashes server-side (never plaintext)
- Revoke refresh tokens on logout/password change/suspicious activity
- Optional token binding to device fingerprint/IP heuristic

## 9.2 Password Security

- Hash using bcrypt (or Argon2 where supported)
- Strong minimum policy and lockout/risk controls after failed attempts
- Force re-auth for critical actions (refund override, role change)

## 9.3 Authorization

- RBAC with fine-grained permissions
- Policy checks in middleware + application service layer
- Enforce store scoping (Staff can access only assigned store data)

## 9.4 API Hardening

- Rate limiting (global + sensitive endpoints e.g., login)
- Helmet-like secure headers
- Strict CORS allowlist
- Input sanitization and payload size limits
- Idempotency keys for payment/refund endpoints
- Validate JWT issuer/audience and expiration

## 9.5 Data Protection & Compliance

- TLS in transit, encrypted backups at rest
- PII minimization and masking in logs
- Immutable audit trails for invoices/refunds/role changes
- Backup + restore drills and retention policy

## 9.6 Observability & Incident Readiness

- Structured logs with correlation IDs
- Centralized monitoring/alerts (error rate, p95 latency, auth failures)
- Security event alerts (excess failed logins, unusual refund spikes)

---

## 10) Scalability and Production Readiness Notes

- Stateless API instances behind load balancer.
- Use Redis for distributed caching, rate limits, session/token revocation.
- Add Mongo indexes for high-cardinality query filters:
  - invoices: `(storeId, issuedAt)`, `(cashierId, issuedAt)`, `invoiceNumber unique`
  - payments: `(invoiceId, paidAt)`
  - customers: `phone`, `email`
  - products: `sku`, `barcode`, `categoryId`
- Use background workers (queue) for heavy exports/report generation.
- Introduce read replicas/analytics store if reporting load grows significantly.
- Apply API versioning (`/api/v1`) and backward-compatible contract evolution.

---

## 11) Suggested Non-Functional SLAs

- API availability: 99.9%+
- p95 response time:
  - transactional endpoints < 300 ms (non-payment gateway latency)
  - reporting endpoints < 2 s for interactive, async for heavy exports
- RPO/RTO targets defined for backups/disaster recovery

---

This architecture is ready for phased delivery:

1. Phase 1: Auth + POS core + basic CRM
2. Phase 2: Dashboard + reports + loyalty
3. Phase 3: advanced controls (multi-store policies, async exports, anomaly detection)
