# JAF — WE ARE THE ION TO FASHION

A premium, dynamic ecommerce platform for the JAF jersey brand, built with Next.js (App Router, Cache Components), PostgreSQL, Prisma ORM and Cloudinary.

## Stack

- **Framework:** Next.js 16 (App Router, Cache Components / Partial Prerendering)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (Radix UI primitives + `class-variance-authority`) in `src/components/ui` — Button, Badge, Input/Textarea/Label, Select, Checkbox, Sheet (cart drawer, mobile nav), Dropdown Menu (nav categories), themed via the CSS variable bridge in `globals.css`
- **Database:** PostgreSQL via Prisma ORM 7 (`pg` driver adapter)
- **Image storage:** Cloudinary via `src/lib/storage`
- **Auth:** [Clerk](https://clerk.com) for the admin dashboard — single dedicated admin identity (email + strong password, provisioned from env vars), session verified in `proxy.ts` and independently re-checked in every admin server action
- **Validation:** Zod

### Setting up Clerk (admin authentication)

The admin dashboard is a single-admin area — there's no public sign-up, just one dedicated email/password identity that you control entirely from `.env`.

1. Create a free account/app at [clerk.com](https://clerk.com).
2. In the Clerk dashboard, go to **User & authentication**: enable **Email address** + **Password**, disable every other sign-in method (no social/OAuth), and disable sign-up under **Restrictions** (set to "restricted" / invite-only, or equivalent) — the app never renders a sign-up form, but this closes the door at Clerk's end too, in case anyone finds `clerk.<your-domain>`'s hosted account portal directly.
3. In **API Keys**, copy the **Publishable key** and **Secret key** into `.env` as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
4. Set `ADMIN_EMAIL` to a real email address you control, and `ADMIN_PASSWORD` to a strong, unique password (a generated one is fine — a password manager, not your memory, should own it).
5. Run `npm run admin:provision`. This creates (or updates) that exact Clerk user from your env vars — no dashboard clicking required, and reruns are safe (it just resets the password).
6. Sign in at `/admin/login`.

`ADMIN_EMAIL` is also checked on every admin request as an allowlist, independent of Clerk's own session check — if Clerk's sign-up were ever accidentally left open, a second account still couldn't reach the dashboard. Changing the admin's credentials later is just: update `.env`, rerun `npm run admin:provision`.

**New-device email verification:** Clerk asks for an emailed one-time code the first time a browser signs in, on top of the password. With a real `ADMIN_EMAIL` this just works — check the inbox. If you're using `npx clerk@latest init`'s temporary dev keys (no real app, no dashboard access) instead of a real Clerk app, there's no inbox behind the address at all; use Clerk's test-email convention — an address ending in `+clerk_test@yourdomain.com` (e.g. `admin+clerk_test@jaf.com`) always accepts `424242` as the code, in development instances only. Switch to a real email once you move to a real Clerk app.

**Also signed in with a different Clerk account?** If a browser already has an unrelated Clerk session (e.g. from running the Clerk CLI, or a previous project using the same dev domain), `/admin/login` will detect it doesn't match `ADMIN_EMAIL` and automatically sign it out before showing the sign-in form — no manual cleanup needed.

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
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` — see "Setting up Clerk" above. The storefront works fully without these; only `/admin` needs them.
   - `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — for image uploads.
   - `NEXT_PUBLIC_SITE_URL` — used for canonical URLs / sitemap / OG metadata

4. **Run migrations, seed demo data, and provision the admin user**

   ```bash
   npm run db:migrate
   npm run db:seed
   npm run admin:provision
   ```

   The seed creates 6 categories, 9 demo products (with photography, sizes and stock) and default store settings. `admin:provision` creates the one admin identity in Clerk from `ADMIN_EMAIL` / `ADMIN_PASSWORD` — see "Setting up Clerk" above.

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
| `npm run admin:provision` | Create/update the single Clerk admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` |

## Project structure

```
prisma/              schema.prisma, migrations, seed.ts
src/app/              routes (storefront, admin, API-less — everything is server actions)
src/components/       layout, home, products, product, cart, checkout, admin, ui
src/lib/data/         read-only Prisma queries (Suspense-wrapped server components call these)
src/lib/actions/      "use server" mutations — cart, checkout, admin CRUD
src/lib/auth/         admin session resolution (Clerk-backed, with the ADMIN_EMAIL allowlist check)
src/lib/storage/      image storage via Cloudinary, validation
scripts/              provision-admin.ts — creates/updates the one Clerk admin user from env vars
src/proxy.ts          runs Clerk's middleware for /admin/* (Next 16 renamed middleware.ts -> proxy.ts; it must live under src/ here since app/ does too — Clerk throws a clear error at runtime if it's at the project root instead); the storefront has no proxy coverage and needs none
```

## Architecture notes

- **Cache Components is enabled** (`next.config.ts`). Pages that read live, per-request data (cart, admin, product/category detail with live stock, shop filters, checkout, order confirmation) are marked `export const instant = false` or wrap their data access in `<Suspense>`, per the framework's static-shell validation. The homepage streams each section independently behind its own Suspense boundary with a skeleton fallback.
- **Cart** is a database-backed `Cart`/`CartItem` pair keyed by a random token in an httpOnly cookie — not purely client-side — so stock is always validated server-side before checkout.
- **Checkout → Order** runs in a single Prisma transaction: it snapshots product/variant/price, decrements variant stock, and clears the cart.
- **Admin auth** is handled by Clerk, scoped to `/admin` only via a dedicated `src/app/admin/layout.tsx` (`<ClerkProvider>` never wraps the storefront, so a missing/misconfigured Clerk key can only ever break the admin area, never the shop). `proxy.ts` runs Clerk's middleware to populate the session; `admin/(dashboard)/layout.tsx` is the actual gate (redirects on no session), and every admin server action independently re-checks via `requireAdminSession()` — defense in depth, since server actions are reachable directly via POST. `requireAdminSession()` additionally enforces that the authenticated email matches `ADMIN_EMAIL`, so this stays a single-admin dashboard even if Clerk sign-up were ever left open by mistake. There is no sign-up flow anywhere in the app — the one admin identity is provisioned via `npm run admin:provision`.
- **Images**: admin uploads go to Cloudinary from a server action; only the returned `publicId` (storage path) and `secureUrl` are stored in Postgres.
- **Homepage content**: every visual section (hero, editorial, final CTA) plus the announcement bar and delivery/payment defaults are stored on the singleton `StoreSetting` row and editable from `/admin/settings`, each with its own image upload where relevant. Categories and products each manage their own images on their respective admin pages.
- **Money** is stored as integer "cents" (paisa-equivalent) throughout to avoid floating-point rounding; `src/lib/money.ts` formats to BDT.
