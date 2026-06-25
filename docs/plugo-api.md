# Plugo API proxy

This project uses Vercel/Next.js Route Handlers as the server layer. Plugo credentials must stay server-only.

## Local setup

Set these values in `.env.local`:

```env
PLUGO_API_BASE_URL=""
PLUGO_REQUESTS_PATH="/requests"
PLUGO_API_KEY=""
PLUGO_SECRET_KEY=""
PLUGO_API_KEY_HEADER_NAME="X-API-Key"
PLUGO_SECRET_KEY_HEADER_NAME="X-Secret-Key"
PLUGO_FORWARD_QUERY_KEYS="page,limit,offset,cursor,status,from,to,startDate,endDate,createdFrom,createdTo,updatedFrom,updatedTo,sort,order,q"
PLUGO_TIMEOUT_MS="10000"
```

Do not add `NEXT_PUBLIC_` to the Plugo key names. `NEXT_PUBLIC_` variables are bundled into browser code.

Run locally:

```bash
npm run dev
```

After admin login, call:

```text
GET /api/admin/plugo/requests
GET /api/admin/plugo/requests?page=1&limit=20&status=open
```

The local route forwards only allowlisted query keys and caps `limit` at `100`.

## Vercel setup

Add the same variable names in Vercel Project Settings -> Environment Variables for the target environments.

Required for the Plugo route:

- `PLUGO_API_BASE_URL`
- `PLUGO_API_KEY`
- `PLUGO_SECRET_KEY`

Optional:

- `PLUGO_REQUESTS_PATH`
- `PLUGO_API_KEY_HEADER_NAME`
- `PLUGO_SECRET_KEY_HEADER_NAME`
- `PLUGO_FORWARD_QUERY_KEYS`
- `PLUGO_TIMEOUT_MS`

The response never includes configured Plugo key values. If Plugo returns an error, the route returns a generic error with only the upstream status code.
