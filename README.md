# SownTV Socials

White-label social growth panel. Customers order YouTube subscribers, Instagram followers, TikTok likes and more. Fulfilment is sent to Jeskie (`jeskieinc.com/api/v2`) from the server.

## Run locally

1. Copy `.env.example` to `.env.local` if needed (already created for this machine).
2. Put your Jeskie API key in `JESKIE_API_KEY`. Never put it in client code.
3. Install and start:

```bash
npm install
npm run dev
```

Open http://localhost:3000

First admin login (from `.env.local`):

- Email: `admin@sowntv.com`
- Password: value of `ADMIN_PASSWORD`

## How money works

- Jeskie is wholesale. This panel sells at `wholesale × MARKUP_MULTIPLIER`.
- Customers fund a SownTV wallet (M-Pesa request → admin approves).
- An order only goes to Jeskie if the customer wallet can cover the retail price.
- Your Jeskie balance still needs to cover the wholesale cost. Top that up on jeskieinc.com.

## Admin

After login, open `/admin` to:

- See Jeskie provider balance
- Set markup and deposit number
- Approve deposits and credit wallets

## Customer API

Logged-in users get an SMM v2 key at `/api-access`. Scripts can POST to `/api/v2` with `key` + `action` (`services`, `add`, `status`, `balance`).
