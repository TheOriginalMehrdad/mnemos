# ERUDITIO

**Save a Markdown file → get flashcards automatically → review exactly what you're about to forget.**

ERUDITIO is a local "second brain" that turns your notes into an adaptive learning
system. You keep writing plain Markdown (`.md`) files in a folder on your computer.
ERUDITIO watches that folder, and every time a file appears or changes it:

1. **Reads and indexes** the note (title, tags, links to other notes, word count, domain/topic from the folder structure).
2. **Auto-generates flashcards** from the content — no manual step.
3. **Schedules reviews** using a spaced-repetition engine (FSRS) so each card comes back right before you'd forget it.
4. **Adapts** to how you actually do: cards you keep getting wrong come back sooner, cards you've mastered fade into the background, and anything you haven't seen in a long time is automatically resurfaced.

Everything runs **100% locally**. No cloud, no accounts, **no login**, no external services.
The AI features (card generation, quizzes, search, insights) are **stubbed** with realistic
mock responses today and are designed so a real local LLM (Ollama) or OpenAI can be plugged
in later by swapping a single provider class.

> **New here / not a developer?** Read **[GUIDE.md](GUIDE.md)** — a plain-language,
> step-by-step guide to starting the app and adding your notes. To convert your own
> `.md` files into the right format automatically, use the **[`add-notes.sh`](add-notes.sh)**
> helper (e.g. `./add-notes.sh -d Biology ~/Desktop/photosynthesis.md`).

---

## Run it in under 5 commands

> Requires Docker. The API, PostgreSQL (with pgvector) and Redis all come up together.

```bash
cp .env.example .env                 # 1. create your config
mkdir -p vault                       # 2. this folder is your Markdown vault
docker compose up --build            # 3. start everything (db + redis + api + web)
```

Then open:

- **App (web UI): http://localhost:8080** — opens straight to your dashboard, **no login required**
- API:        http://localhost:3000
- Health:     http://localhost:3000/health
- API docs:   http://localhost:3000/api  (interactive OpenAPI / Swagger UI)

The web UI is the React frontend wired to the live API: the dashboard, library, adaptive
review sessions, knowledge graph, and progress charts all read real backend data, and saving
a Markdown file into `./vault` makes new flashcards appear in the UI within seconds (via WebSocket).

This is a single-user local app, so there is no sign-in step — every request is automatically
the one seeded user.

Drop a `.md` file into `./vault` (or a subfolder like `./vault/Math/Algebra/Groups.md`)
and within a few seconds flashcards are generated for it — watch the `cards:generated`
event on the WebSocket namespace `/eruditio`, or call `GET /review/queue`.

### Running without Docker (local dev)

```bash
npm install
npm run build -w @eruditio/shared      # build the shared FSRS/types package
# point DATABASE_URL / REDIS_URL at local Postgres+Redis, then:
npm run db:setup -w @eruditio/api      # create schema + seed admin user
npm run dev                            # start the API with hot reload
```

### Tests

```bash
npm test          # FSRS + adaptive-queue unit tests (Vitest) and the vault indexer test (Jest)
```

---

## How the adaptive queue works (in plain English)

A fixed schedule ("review everything every 3 days") wastes time on things you know and
neglects things you don't. ERUDITIO instead asks, every time you start a session:

> *"Given everything this person has practiced, what do they most need to review right now?"*

Each due card gets an **urgency score**. Higher score = shown sooner. The score balances
five very human ideas:

- **How overdue is it, relative to how well you know it?**
  Being 3 days late on a shaky card matters far more than being 3 days late on one you've
  nailed for months. *(overdue ratio = days overdue ÷ memory stability)*

- **Have you been getting it wrong — recently?**
  Cards you've missed bubble up, and mistakes in the last week hurt twice as much as old ones.

- **Is it brand new?**
  Freshly generated cards from notes you just saved get a baseline boost so they enter
  rotation quickly instead of waiting behind a backlog.

- **Are you on a roll with it?**
  Cards you keep getting right get *slightly* deprioritized — you're clearly learning them,
  so ERUDITIO won't over-drill them.

- **Has it been gathering dust?**
  A nightly job finds notes you haven't touched in over a month whose memory has decayed,
  and bumps their priority so they resurface on their own.

The session is then **interleaved** — no more than two cards in a row from the same note or
domain — because mixing topics is proven to strengthen retention. Finally it's capped to a
sensible session length.

Every weight in this formula (`OVERDUE_WEIGHT`, `MISTAKE_WEIGHT`, `NEW_CARD_WEIGHT`,
`STREAK_BONUS_WEIGHT`, session sizes, the long-absence threshold) lives in `.env`, so you
can tune how aggressive the tutor is without touching code.

---

## Architecture

Monorepo with npm workspaces:

```
eruditio/
├── apps/api/            NestJS backend (controllers → services → Prisma)
│   ├── src/auth         single-user mode — no login (every request = the seeded user)
│   ├── src/vault        chokidar watcher + connect/status/sync
│   ├── src/jobs         BullMQ queues & processors (index, card-gen, maintenance)
│   ├── src/review       adaptive queue + rating + mistake amplification
│   ├── src/notes,cards  notes, flashcards, FSRS wiring
│   ├── src/graph,stats  knowledge graph & progress analytics
│   ├── src/ai           swappable AIProvider (stubbed)
│   └── src/realtime     Socket.io gateway (namespace /eruditio)
├── packages/shared/     pure, framework-free FSRS engine + adaptive scorer + shared types
├── docker-compose.yml   postgres (pgvector) + redis + api
└── .env.example
```

- **Database:** PostgreSQL via Prisma (migrations/`db push`).
- **Background jobs:** BullMQ + Redis (vault indexing, card generation, nightly maintenance).
- **File watching:** chokidar.
- **Real-time:** Socket.io — events: `vault:progress`, `vault:changed`, `cards:generated`,
  `review:rated`, `review:resurfaced`, `stats:updated`.
- **FSRS:** implemented from scratch in `packages/shared/src/fsrs.ts` (no external FSRS package).

## Key API endpoints

| Area    | Endpoint |
|---------|----------|
| Auth    | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Vault   | `POST /vault/connect`, `GET /vault/status`, `POST /vault/sync` |
| Notes   | `GET /notes`, `GET /notes/:id`, `GET /notes/domains`, `GET /notes/:id/links`, `GET /notes/:id/cards` |
| Cards   | `GET /cards`, `POST /cards`, `PATCH /cards/:id`, `POST /cards/:id/suspend`, `POST /cards/bulk-import` |
| Review  | `GET /review/queue`, `POST /review/:cardId/rate`, `GET /review/stats/today`, `GET /review/stats/range` |
| Graph   | `GET /graph` |
| Progress| `GET /progress/overview`, `GET /progress/domains`, `GET /progress/heatmap` |
| Language| `GET /languages`, `PUT /languages/:code` |
| AI (stub)| `POST /ai/generate-cards`, `POST /ai/generate-quiz`, `POST /ai/summarize`, `POST /ai/search`, `GET /ai/daily-insight` |

Full, interactive documentation is at **`/api`** when the server is running.
