# JAF — Jerseys & Fashion (Next.js 16 E-Commerce)

High-performance e-commerce platform for authentic football jerseys, built on the Next.js 16 App Router with Partial Prerendering (PPR), PostgreSQL via Prisma ORM 7, Better Auth for multi-role staff access control, and Cash on Delivery (COD) guest checkout.

## Tech stack

- **Framework:** Next.js 16.4.3 (App Router, PPR, `proxy.ts`, async request headers)
- **Runtime / Language:** Node.js, TypeScript 5, React 19
- **Components:** shadcn/ui (Radix UI primitives + `class-variance-authority`) in `src/components/ui`
- **Database:** PostgreSQL via Prisma ORM 7 (`pg` driver adapter)
- **Image storage:** Cloudinary via `src/lib/storage`
- **Auth:** [Better Auth](https://www.better-auth.com) for the admin dashboard — multi-role staff RBAC (`owner`, `order_manager`, `product_manager`, `support`), session verified in `proxy.ts` and independently re-checked in every admin server action
- **Validation:** Zod

### Setting up Better Auth (Admin & Staff Authentication)

The admin dashboard is strictly restricted to store personnel. Storefront customers NEVER have accounts, login, or registration portals. Public sign-up is completely blocked on the server (`disableSignUp: true`).

1. Set `BETTER_AUTH_SECRET` in `.env` (a random 32+ character string).
2. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` for the store owner.
3. Run the bootstrap script:
   ```bash
   npm run admin:bootstrap
   ```
   This creates (or safely updates) the primary `owner` account in your database.
4. Sign in at `/admin/login`.
5. Once signed in as the owner, you can provision additional team members (e.g. Order Managers, Product Managers, Support) at `/admin/staff`.

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start a local PostgreSQL database.** Easiest with Docker:
   ```bash
   docker run -d --name jaf-postgres \
     -e POSTGRES_USER=jaf -e POSTGRES_PASSWORD=jafpassword -e POSTGRES_DB=jaf_jersey \
     -p 55432:5432 postgres:16-alpine
   ```

3. **Configure environment variables.** Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — e.g. `postgresql://jaf:jafpassword@localhost:55432/jaf_jersey?schema=public`
   - `BETTER_AUTH_SECRET` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` — see "Setting up Better Auth" above.
   - `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — for image uploads.
   - `NEXT_PUBLIC_SITE_URL` — used for canonical URLs / sitemap / OG metadata

4. **Sync database and bootstrap owner**
   ```bash
   npm run db:generate
   npm run admin:bootstrap
   ```

5. **Run the dev server**
   ```bash
   npm run dev
   ```

   Storefront: http://localhost:3000 — Admin: http://localhost:3000/admin/login

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate the Prisma client from `prisma/schema.prisma` |
| `npm run db:migrate` | Create/apply a migration (`prisma migrate dev`) |
| `npm run db:seed` | Re-run the seed script |
| `npm run db:studio` | Open Prisma Studio |
| `npm run admin:bootstrap` | Idempotently create/update the store owner user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` |

## Project structure

```
prisma/              schema.prisma, migrations, seed.ts
src/app/              routes (storefront, admin, /api/auth/[...all] Better Auth handler)
src/components/       layout, home, products, product, cart, checkout, admin, ui
src/lib/data/         read-only Prisma queries (Suspense-wrapped server components call these)
src/lib/actions/      "use server" mutations — cart, checkout, admin CRUD, staff management
src/lib/auth/         Better Auth server config, client, sessions & RBAC permission definitions
src/lib/storage/      image storage via Cloudinary, validation
scripts/              bootstrap-owner.ts — provisions the initial store owner
src/proxy.ts          scoped session proxy for /admin/* (Next 16 proxy)
```

## Architecture & Security Notes

- **Storefront & Guest Privacy**: Customers never sign in or register. Checkout captures only shipping details for order fulfillment. No customer user accounts exist.
- **Admin Auth & RBAC**: Handled by Better Auth with PostgreSQL Prisma adapter. Scoped to `/admin` and `/api/admin`.
- **Roles & Permissions**:
  - `owner`: full administrative privileges, store settings, and staff provisioning.
  - `order_manager`: view orders, print invoices, update order fulfillment status.
  - `product_manager`: add and update products, manage categories, image upload, variant stock.
  - `support`: read-only access to orders and catalog to assist shoppers.
- **Session Revocation**: When an owner disables a staff member at `/admin/staff`, all active database sessions for that staff member are terminated immediately.
