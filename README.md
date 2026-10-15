# Black Cinema Atlas

A Black cinema explorer built from [gnovotny/nothing-to-watch](https://github.com/gnovotny/nothing-to-watch). Discover films through cast, filmmakers, decades, themes and settings, then ask a movie guide for grounded suggestions.

## Current build

- Original Voroforce/WebGL poster universe, adapted to generate poster sheets from live API results; accessible still poster wall and search/filter controls.
- Curated starter catalog of 95 films, with TMDB credits, posters, trailers and country-specific JustWatch provider listings refreshed through a server cache.
- Graph relationships and explainable recommendations shared by the explorer and Gemini tool-calling guide.
- Server-persisted watchlists, likes, viewing preferences and chat history. Guests use a private session cookie; Sites sign-in supports account preferences across devices.
- Movie-night shortlists, shareable group links, and one vote per browser/account.
- Twilio webhook with signature verification, duplicate protection, asynchronous replies, HELP/STOP handling, and rate limits. **SMS activation is pending account/number configuration and end-to-end verification.**

This is an expanding editorial collection, not a comprehensive catalog or an automated ethnicity classifier. Themes and settings are editorial tags. Credits and film metadata come from TMDB. Subscription recommendations only claim matches when the provider has been checked for the selected country.

## Run locally

Use Node 24 or later (the preview uses built-in SQLite):

```sh
npm ci
cp .env.example .env.local
# Fill the private credentials in .env.local.
npm run dev
```

Open http://127.0.0.1:3000. The local SQLite database lives in ignored `work/`. This development server is not the production hosting arrangement.

```sh
npm test
npm run build
```

The build emits a cloud Worker at `dist/server/index.js`, embeds frontend assets, and includes the schema migrations. Production uses hosted D1 storage and server-side Gemini/TMDB requests; it requires no running user computer. Sites identity and source configuration are in `.openai/hosting.json`. Runtime secrets must be configured in the hosting environment separately; no secret belongs in that manifest or the browser bundle.

## Configuration

See [.env.example](.env.example) for names only. Use either TMDB's read access token or API key, plus a Gemini API key. The guide defaults to `gemini-2.5-flash`. Free-tier availability and quota depend on the provider; app caps default to 200 chat turns/day globally, 8/minute, and 40/user/day (20/SMS user/day). Each turn can make several tool/model calls, so provider quota can be reached earlier. No paid fallback is enabled.

SMS needs a messaging-capable Twilio number, account SID, auth token, public HTTPS origin, and `SMS_ENABLED=true`. Set the number's inbound messaging webhook to `POST https://<public-origin>/api/sms`. Keep SMS disabled until the account is eligible and the number/webhook are verified. Trial restrictions and carrier registration can prevent public use. Web and SMS histories are separate.

## API

- `GET /api/status`, `/api/films`, `/api/films/:id`, `/api/films/:id/connections`
- `GET/PUT /api/profile`; `GET/DELETE /api/history`
- `POST /api/chat`, `/api/recommend`
- `POST /api/groups`; `GET /api/groups/:id`; `POST /api/groups/:id/vote`
- `POST /api/sms` (Twilio-signed requests only)

Film filters include `q`, `decade`, `genre`, `theme`, `city`, `person`, `max_runtime`, `cluster`, `limit`, and `offset`. The app exposes its curated collection; it does not blindly classify TMDB's entire catalog as Black cinema.

## Data and source

`atlas/data/editorial.json` records the collection's themes/settings. `scripts/import-atlas.py` refreshes the starter data using a private TMDB credential. `atlas/graph.mjs` builds graph relationships; `atlas/service.mjs` implements the hosted API and agent tools. `db/schema.ts` and `drizzle/` own persistent storage. Append new migrations after the initial migration has been deployed.

See [docs/HANDOFF.md](docs/HANDOFF.md) for verified progress, pending activation, and the next steps. See [docs/REA-FINDINGS.md](docs/REA-FINDINGS.md) for shipped-reference observations and the unsuccessful REA tool attempts; no REA Evidence ID was obtained.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Viewing availability is supplied by JustWatch through TMDB. Official TMDB logo source: [logos and attribution](https://www.themoviedb.org/about/logos-attribution).

Original app and engine: [There's nothing to watch](https://github.com/gnovotny/nothing-to-watch). Preserve [LICENSE](LICENSE), file-level copyright notices, and shader attribution. The retained shader includes CC BY-NC-SA 3.0 conditions; review those terms before commercial distribution. Movie imagery remains owned by its respective rights holders.
