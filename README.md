This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment Variables

Copy `.env.local.example` to `.env.local` and add your project-specific values before running the app locally or deploying:

```
cp .env.local.example .env.local
```

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` power server-side booking/admin actions (keep them secret).
- `SUPABASE_ANON_KEY` plus the `NEXT_PUBLIC_SUPABASE_*` values power the browser client for user login.
- `RESEND_API_KEY`, `ALERT_FROM`, and `ALERT_TO` enable email notifications (optional).

Restart the dev server after updating environment variables so the changes take effect.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Monitoring & SEO Ops

- Use `npm run analyze` (or `yarn analyze`) to open the built-in bundle analyzer and keep the shared client chunk under control.
- Add a lightweight error monitor such as Vercel Analytics, Sentry, or LogRocket to catch runtime issues post-release.
- Schedule periodic pings to `https://www.zeta-eng.co.kr/sitemap.xml` (or resubmit in Search Console) whenever new content launches so crawlers pick up updates fast.

## Account Recovery

- Users can request a reset link at `/auth/forgot-password`; Supabase redirects back to `/auth/reset-password` to set a new password.
- Add these URLs to the Supabase Auth > Redirect URLs list for each provider/environment.
- The login forms link to the reset flow; confirm transactional emails arrive before launch.

## Consultations & Reservations

- The enrollment page now uses a two-card layout: left card captures booking details (type, schedule, notes), right card handles account sign in/up or guest checkout.
- Bookings include an `appointment_type` of `consultation` or `entrance_test`. Update the Supabase `consultations` table (or create the new `reservations` table) to include a `type` column: `ALTER TABLE consultations ADD COLUMN type text DEFAULT 'consultation';`.
- Guest bookings are allowed; authenticated users are still linked via `user_id`. Add any new columns to Supabase and re-run the admin dashboard to confirm badges show correctly.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
