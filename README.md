# Black Cinema Atlas ✦

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcornishlikeadam%2Fblack-cinema-atlas)
![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-7.0-purple?style=flat-square)
![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)
![WebGL](https://img.shields.io/badge/WebGL-Voroforce-gold?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-13%20Passing-brightgreen?style=flat-square)

> **Every story connects.**  
> A living, visual universe celebrating Black cinema across eras, filmmakers, and the diaspora. Discover films through cast, directors, decades, themes, and settings—guided by **The Griot**, an AI cinema concierge, and framed by an authentic **Art & Cinema Cultural Shop**.

---

## 🌟 What is Black Cinema Atlas?

Black Cinema Atlas is an independent discovery platform designed to explore the deep artistic and cultural threads of Black film. Instead of sterile algorithms and generic recommendation feeds, the Atlas invites you to drift through an interactive universe of cinema where every film is connected by creative lineage, musical DNA, geographical memory, and shared emotional arcs.

Built upon a custom WebGL force-directed Voronoi simulation engine (adapted from [gnovotny/nothing-to-watch](https://github.com/gnovotny/nothing-to-watch)), the Atlas transforms film exploration into a fluid, tactile journey.

---

## 🚀 Key Features

### 🌌 1. The Voronoi / WebGL Poster Universe
- **Force-Directed Spatial Mapping:** Browse hundreds of films in an interactive force simulation clustering by **Decade**, **Director**, or **Thematic Movements**.
- **Accessible Dual Views:** Switch seamlessly between the **Voronoi Atlas** (spatial cosmic view) and the **Poster Wall** (curated grid view).
- **Lineage Maps:** Select any film to open interactive connection maps showing shared directors, cast, writers, and themes.

### 🤖 2. The Griot (Atlas AI Cinema Concierge)
- **Culturally Fluent Recommendations:** Grounded in Black cinema history, from the Harlem Renaissance and the 1970s L.A. Rebellion to 1990s neo-soul romance and contemporary Afrofuturism.
- **Multi-Provider LLM Router:** Resilient failover architecture combining **OpenRouter** (primary free & low-cost models), **Groq** (sub-300ms lightning-fast structured reasoning), and **Gemini 2.5 Flash** (high-accuracy fallback).
- **Spoiler-Free by Default:** Thoughtful introductions, discussion prompts, and streaming availability without ruining plot twists.
- **Shop & Cultural Awareness:** Suggests connected fine art prints, monographs, and vinyl soundtracks relevant to the films you love.

### 🎨 3. Curated Cultural Art & Cinema Shop
- **Fine Art & Silkscreen Prints:** Limited-edition screen-prints by contemporary Black artists celebrating classics like *Do the Right Thing*, *Love Jones*, *Daughters of the Dust*, and *Space Is the Place*.
- **Auteur Apparel:** Heavyweight garment-dyed tees honoring groundbreaking Black directors and 16oz cotton canvas cinema club totes.
- **Books, Syllabi & Vinyl:** 180g audiophile soundtrack pressings, cinematography monographs, and field guides like *The L.A. Rebellion Film School in a Box*.
- **Direct Cultural Impact:** **15% of all shop proceeds** directly fund emerging Black independent filmmakers and archival film preservation.
- **Seamless Interactive Bag & Checkout:** Built-in cart management with free shipping progress bar, instant order summary, and simulated carbon-neutral checkout.

### 👥 4. Movie Night Collaborative Matcher
- **Consensus Without Arguments:** Input viewer tastes (e.g. *"Alex: comedy, romance; Sam: drama, music"*), mood, time constraints, and streaming services.
- **Live Regional Checks:** Powered by TMDB and JustWatch data across the US, UK, Canada, Nigeria, South Africa, Kenya, France, and beyond.
- **Shareable Voting Rooms:** Create a group link (`/night/:id`) where friends can vote directly on their phones.

---

## ⚡ Quickstart (Local Development)

### Prerequisites
- Node.js 22 or later (uses built-in `node:sqlite`)
- npm or bun

### 1. Clone the repository
```bash
git clone https://github.com/cornishlikeadam/black-cinema-atlas.git
cd black-cinema-atlas
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API credentials (all are optional for basic browsing, but unlock AI and live streaming metadata):
```env
# AI Providers (Any or all can be supplied)
OPENROUTER_API_KEY=your_openrouter_key
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_api_key

# Film Metadata & Streaming (TMDB)
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
# or: TMDB_API_KEY=your_tmdb_v3_key

# Optional SMS / Twilio Integration
SMS_ENABLED=false
```

### 4. Start the local server
```bash
npm run dev
```
Open **[http://127.0.0.1:3000](http://127.0.0.1:3000)** in your browser.

### 5. Run tests & production build
```bash
# Run unit & API test suites
npm test

# Build client assets & serverless endpoints
npm run build
```

---

## ☁️ Deploying to Vercel (1-Click)

Black Cinema Atlas is re-engineered to run natively on **Vercel** as a full-stack static + serverless deployment with zero external database dependencies required to start.

### Option A: 1-Click Deploy via Vercel Dashboard
1. Click the **[Deploy with Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcornishlikeadam%2Fblack-cinema-atlas)** button at the top of this repository.
2. Connect your GitHub account and select your repository.
3. In **Environment Variables**, configure:
   - `OPENROUTER_API_KEY` (or `GEMINI_API_KEY` or `GROQ_API_KEY`)
   - `TMDB_READ_ACCESS_TOKEN` (or `TMDB_API_KEY`)
4. Click **Deploy**. Vercel will automatically run `npm run build` and launch the site on your custom `*.vercel.app` domain.

### Option B: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
```

### How Vercel Deployment Works Under the Hood
- [vercel.json](file:///Users/kjcornish/.gemini/antigravity/scratch/black-cinema-atlas/vercel.json): Configures the Vite build framework, sets output directory to `dist/client`, and handles SPA routing rewrites.
- [api/index.js](file:///Users/kjcornish/.gemini/antigravity/scratch/black-cinema-atlas/api/index.js): Vercel Serverless Function that proxies API calls and TMDB media poster requests (`/media/...`) with edge caching headers (`Cache-Control: public, s-maxage=604800`).
- [api/db.js](file:///Users/kjcornish/.gemini/antigravity/scratch/black-cinema-atlas/api/db.js): Resilient database provider that uses `/tmp/atlas.sqlite` with automatic Drizzle schema migrations when running on Vercel Node 22, and provides an in-memory fallback so user preferences, movie night rooms, and history never crash.

---

## 🗺️ Project Architecture & Directory Map

```
black-cinema-atlas/
├── api/                                # Vercel Serverless Functions
│   ├── index.js                        # Unified Vercel API & TMDB media proxy
│   ├── [...path].js                    # Catch-all serverless router
│   └── db.js                           # Resilient SQLite & in-memory database adapter
├── atlas/                              # Core Application Codebase
│   ├── data/
│   │   ├── catalog.json                # Seed collection of curated Black cinema
│   │   ├── editorial.json              # Editorial themes, eras, and geography tags
│   │   └── shop.json                   # Curated cultural art, apparel & vinyl items
│   ├── main.jsx                        # React root, navigation, Shop, & view controllers
│   ├── AtlasCanvas.jsx                 # Voroforce WebGL canvas bridge
│   ├── service.mjs                     # Hosted API handlers, recommendation engine, shop logic
│   ├── graph.mjs                       # Story connections graph & ranking algorithms
│   ├── worker.mjs                      # Cloudflare Worker / edge fetch handler
│   ├── style.css                       # Obsidian & antique gold cinema design system
│   └── tests/                          # Automated test suites (node:test)
├── src/server/ai/
│   └── llmRouter.ts                    # Multi-provider LLM Router (OpenRouter + Groq + Gemini)
├── supabase/migrations/
│   └── 001_initial_atlas.sql           # PostgreSQL + pgvector schema for 1,000+ films
├── voroforce/                          # WebGL Force-directed Voronoi physics engine
├── drizzle/                            # Database migrations (preferences, votes, cache)
├── public/                             # Static assets, sitemap.xml, robots.txt, og.jpg
├── scripts/
│   ├── build-atlas.mjs                 # Production asset bundler
│   └── dev-atlas.mjs                   # Local development server with live SQLite
└── vercel.json                         # Vercel deployment and rewrite configuration
```

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/status` | `GET` | Health status of AI, TMDB, database, and SMS integrations |
| `/api/films` | `GET` | Filter curated films by `q`, `decade`, `genre`, `theme`, `city`, `person`, `cluster` |
| `/api/films/:id` | `GET` | Verified credits, synopsis, trailer key, and country viewing options |
| `/api/films/:id/connections` | `GET` | Thematic and credit graph links for a specific film |
| `/api/shop` | `GET` | Retrieve curated art prints, apparel, vinyl, and books with category/search filters |
| `/api/shop/:id` | `GET` | Individual shop item details, specifications, artist profile, and connected film |
| `/api/profile` | `GET / PUT` | Read and update watchlists, liked films, region, and streaming subscriptions |
| `/api/recommend` | `POST` | Rank film options based on group mood, time window, and verified streaming availability |
| `/api/chat` | `POST` | Conversational message endpoint for The Griot AI cinema concierge |
| `/api/groups` | `POST` | Create a shareable Movie Night room |
| `/api/groups/:id` | `GET` | Retrieve room details, shortlisted consensus films, and votes |
| `/api/groups/:id/vote` | `POST` | Cast an anonymous vote for a shortlist film |
| `/media/:size/:file` | `GET` | Edge-cached TMDB poster/backdrop proxy |

---

## 🧭 Scaling Beyond 95 to 1,000+ Films

The next phase of Black Cinema Atlas scales the collection from 95 core curated films to 1,000+ explorable titles across the African diaspora using a **3-stage automated pipeline**:

1. **Seed Harvesting (Wikidata SPARQL + Curated Archives):** Ingest films from canonical archives (L.A. Rebellion, BFI Black Star, Pan-African Film Festival, Library of Congress National Film Registry, Sundance Black Indie Alumni).
2. **Metadata & Streaming Enrichment:** Hydrate high-resolution posters, cast/crew hierarchies, and streaming links from TMDB and Watchmode.
3. **AI Cultural Taxonomy & Vector Embeddings:** Tag each film with **Coming-of-Age Tropes**, **Sonic Profiles**, **Diaspora Regions**, and 1536-dimensional `vibe_embeddings` stored in **Supabase pgvector** ([see schema](supabase/migrations/001_initial_atlas.sql)).

---

## ⚖️ Attribution & Licensing

- **Film Metadata & Imagery:** This product uses the TMDB API but is not endorsed or certified by TMDB. Availability data supplied by JustWatch through TMDB.
- **Engine Attribution:** Built from [There’s nothing to watch](https://github.com/gnovotny/nothing-to-watch) by gnovotny. Preserves original Voroforce shader attribution (CC BY-NC-SA 3.0). Review shader licensing terms before commercial re-distribution.
- **Codebase License:** Software and application code licensed under the [MIT License](LICENSE).
