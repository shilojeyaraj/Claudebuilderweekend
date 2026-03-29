# Parliament Watch — What's Built

A nonpartisan Canadian Parliament bill tracker. Citizens can browse active bills, ask Claude to explain them in plain language, vote support/oppose, and contact their MP.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.1 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| AI | Anthropic SDK — Claude Haiku 4.5 |
| Hosting target | Vercel |

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude AI chat |
| `REFRESH_SECRET` | Yes | Protects `POST /api/bills/refresh` |

Copy `.env.local.example` → `.env.local` and fill in values.

---

## Data Sources

| Source | URL | Auth | Use |
|---|---|---|---|
| LEGISinfo | `parl.ca/LegisInfo` | None | Primary bill data (static snapshot + live fetch) |
| OpenParliament | `api.openparliament.ca` | None | Bill enrichment: subjects, votes, debates |
| Represent | `represent.opennorth.ca` | None | MP lookup by postal code |
| Anthropic | `api.anthropic.com` | API Key | Claude Haiku agent |

---

## Backend — Library Files

### `lib/types.ts`
Core TypeScript interfaces shared across the app:
- `Bill` — full LEGISinfo bill schema (45+ fields)
- `SentimentVote` — `{ billId, support, oppose }`
- `MPResult` — `{ name, party, district, email, url, photo_url }`
- `UserInterests` — `{ topics: string[] }` — user's selected topic filters for Claude

### `lib/bills.ts`
Helpers over the static `public/bills.json` snapshot:
- `getAllBills()` — returns all bills sorted by latest activity
- `getBillById(id)` — find a single bill
- `getTopicTag(bill)` — keyword-match title → topic string (Health, Housing, Economy, etc.)
- `getStatusColor(status)` — maps status string → Tailwind badge class
- `TOPIC_TAGS` — array of all valid topic strings

### `lib/legisinfo.ts`
Live Parliament of Canada LEGISinfo API client:
- `fetchLiveBills()` — fetches from `parl.ca/LegisInfo/en/bills/export`, cached 6h, tagged `legisinfo-bills`
- `getBills()` — wraps `fetchLiveBills()` with static fallback on error
- `getLiveBillById(id)` — single bill lookup through live data
- `LEGISINFO_CACHE_TAG` — `'legisinfo-bills'` — used by the refresh endpoint
- Parliament / session constants at top of file — update when Parliament changes

### `lib/openparliament.ts`
OpenParliament API client (`api.openparliament.ca`):
- `fetchOPBills(session?)` — paginated bill list, cached 6h
- `fetchOPBill(session, number)` — single bill detail with summary + subjects
- `fetchVotes(billUrl)` — voting records for a bill
- `fetchDebates(billUrl)` — Hansard debate excerpts referencing a bill
- All responses tagged `openparliament` for cache invalidation

### `lib/sentiment-store.ts`
In-memory vote store (resets on server restart — sufficient for demo):
- `getTally(billId)` — `{ support: number, oppose: number }`
- `recordVote(billId, direction)` — increment and return updated tally

---

## Backend — API Routes

### Bills

| Method | Route | Description |
|---|---|---|
| GET | `/api/bills` | List all bills. Query: `search`, `chamber` (House\|Senate), `topic`, `limit` (max 500, default 200), `offset` |
| GET | `/api/bills/:id` | Single bill by LEGISinfo ID. Returns bill + `topicTag` + `statusColor`. 404 if not found |
| GET | `/api/bills/search?q=` | Dedicated keyword search across title, code, sponsor. Returns `{ total, bills[] }` |
| GET | `/api/bills/trending` | Top 10 bills with activity in the last 30 days. Query: `limit` (default 10) |
| POST | `/api/bills/refresh` | Invalidate the LEGISinfo cache. Body: `{ secret: string }`. Returns 204. Requires `REFRESH_SECRET` env var |

### Chat

| Method | Route | Description |
|---|---|---|
| POST | `/api/chat` | Stream a Claude Haiku response. Body: `{ messages, bill, userInterests? }`. Returns `text/plain` chunked stream |

The system prompt is nonpartisan, grounded in the bill's LEGISinfo data, and adapted when `userInterests.topics` are provided.

### MP Lookup

| Method | Route | Description |
|---|---|---|
| GET | `/api/mp?postal_code=` | Look up the House of Commons MP for a Canadian postal code via Represent API. Returns `MPResult` |

### Sentiment

| Method | Route | Description |
|---|---|---|
| GET | `/api/sentiment?billId=` | Get current support/oppose tally for a bill |
| POST | `/api/sentiment` | Cast a vote. Body: `{ billId: number, direction: "support" \| "oppose" }` |

### OpenParliament Proxies

| Method | Route | Description |
|---|---|---|
| GET | `/api/votes?bill=` | Voting records for a bill. `bill` = OpenParliament bill URL e.g. `/bills/45-1/C-5/` |
| GET | `/api/debates?bill=` | Hansard debate excerpts mentioning a bill |

---

## Frontend — Pages

### `app/page.tsx` — Home
Client component. Loads all bills from static snapshot, renders filterable grid.
Filters: free-text search, chamber (House/Senate/All), topic tag.

### `app/bills/[id]/page.tsx` — Bill Detail
Async server component. Fetches live bill via `getLiveBillById`. Renders:
- Bill header (code badge, title, sponsor, chamber, last activity)
- Legislative progress bar (First Reading → Royal Assent)
- Reading timestamps grid
- Claude chat (`ChatInterface`)
- Sentiment poll (`SentimentPoll`) — sidebar
- MP contact widget (`MPContactWidget`) — sidebar
- LEGISinfo official source link — sidebar

### `app/bills/house/page.tsx` — House Bills
Async server component. Fetches live bills via `getBills()`, filters to `IsHouseBill`. Uses `BillListingPage`.

### `app/bills/senate/page.tsx` — Senate Bills
Async server component. Fetches live bills via `getBills()`, filters to `IsSenateBill`. Uses `BillListingPage`.

### `app/bills/trending/page.tsx` — Trending Bills
Async server component. Fetches live bills via `getBills()`, filters to those with activity in last 30 days. Uses `BillListingPage`.

### `app/mp/page.tsx` — Find Your MP
Server component. Full-page wrapper around `MPContactWidget` — standalone MP lookup without a specific bill.

---

## Frontend — Components

### `ClientLayout.tsx`
Client component wrapping the entire app. Provides:
- Sticky header with logo and burger menu button
- Collapsible sidebar with nav links (Home, Trending Bills, Find Your MP, House Bills, Senate Bills)
- Sidebar hidden by default — opens/closes via burger toggle
- Footer with data attribution

### `BillCard.tsx`
Link card for bill grids. Shows: bill code, topic badge, status badge, title, sponsor, last activity date.

### `BillListingPage.tsx`
Reusable server component for pre-filtered bill lists. Takes `{ title, description, bills, emptyMessage }`. Used by house/senate/trending pages.

### `ChatInterface.tsx`
Streaming chat UI. Shows suggested questions before first message. Streams Claude's response chunk-by-chunk. Sends `{ messages, bill }` to `/api/chat`.

### `SentimentPoll.tsx`
Support/oppose vote buttons. Uses `localStorage` to prevent double-voting. Shows live percentage bar after vote.

### `MPContactWidget.tsx`
Postal code form → Represent API lookup → MP card with photo, party, riding. Generates a pre-filled `mailto:` link. Bill context (`billTitle`, `billNumber`) is optional — works standalone on `/mp` page.

---

## Caching Strategy

| Data | Cache duration | Invalidation |
|---|---|---|
| LEGISinfo bills | 6 hours | `POST /api/bills/refresh` → `revalidateTag('legisinfo-bills', 'max')` |
| OpenParliament bills | 6 hours | `revalidateTag('openparliament', 'max')` |
| OpenParliament votes/debates | 1 hour | Same tag |
| MP lookup (Represent) | Not cached (request-time) | — |
| Sentiment votes | In-memory, no expiry | Server restart |

---

## Bill Data Flow

```
Request to /api/bills or bills/[id]
  └─ lib/legisinfo.ts → fetchLiveBills()
        ├─ HIT: Next.js server cache (6h TTL, tag: legisinfo-bills)
        └─ MISS: fetch parl.ca/LegisInfo → parse JSON → cache
              └─ ERROR: fall back to public/bills.json snapshot
```

---

## Refresh / Cron Flow

```
Nightly cron (or manual):
  POST /api/bills/refresh { "secret": "..." }
    └─ revalidateTag('legisinfo-bills', 'max')
         └─ Next request to any bills route fetches fresh data from Parliament
```
