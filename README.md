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
- `STRIPE_WEBHOOK_SECRET` (recommended)
- `STRIPE_PRICE_REGISTRATION`
- `STRIPE_PRICE_WEEKLY_DUES`
- `STRIPE_PRICE_SHARE_TOP2`
- `STRIPE_PRICE_SHARE_TOP34`
- `STRIPE_PRICE_SHARE_TOP58`
- `STRIPE_PRICE_SHARE_UNRANKED`

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
