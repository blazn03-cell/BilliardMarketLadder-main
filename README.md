# BilliardMarketLadder

Pool Market Ladder — a bar pool billiards league where bar patrons buy shares in players.

See `index.html` for the live site.

## Minimal Launch Features Included

- Operator signup/login
  - Uses Supabase Auth when configured.
  - Falls back to local browser auth if Supabase keys are not set.
- Core ladder features
  - Player management, matches, standings, supporters, playoffs, and P&L views.
- Stripe checkout from Shares tab
  - "Buy 1" triggers `/api/create-checkout` for a single share at the current tier.
- Cloud save/load
  - "Save Cloud" writes current dashboard state through `/api/sync-state`.
  - "Load Cloud" restores latest dashboard snapshot through `/api/load-state`.

## Environment Variables

Server-side (Vercel or your host):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (required for webhook signature verification)
- `APP_BASE_URL` (for strict CORS allowlist, e.g. `https://your-app.vercel.app`)
- `ALLOWED_ORIGINS` (optional comma-separated extra origins)
- `STRIPE_PRICE_REGISTRATION`
- `STRIPE_PRICE_WEEKLY_DUES`
- `STRIPE_PRICE_SHARE_TOP2`
- `STRIPE_PRICE_SHARE_TOP34`
- `STRIPE_PRICE_SHARE_TOP58`
- `STRIPE_PRICE_SHARE_UNRANKED`

Recommended DB table for webhook idempotency:

- `webhook_events(event_id text primary key, event_type text, processed_at timestamptz)`

Client-side (set on `window` before app script, or localStorage):

- `BML_SUPABASE_URL`
- `BML_SUPABASE_ANON_KEY`

Example in `index.html` before app scripts:

```html
<script>
  window.BML_SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
  window.BML_SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
</script>
```
