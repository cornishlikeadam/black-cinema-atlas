# Agent handoff — Black Cinema Atlas

Updated 2026-10-15. User requests checkpoints on GitHub after every meaningful step so a separate agent can continue. Keep this handoff accurate. Never expose/commit credentials or print `.env.local`.

## Current outcome

**Public site:** https://black-cinema-atlas.fresh-cream-7054.chatgpt.site

**GitHub:** https://github.com/cornishlikeadam/black-cinema-atlas (fork of gnovotny/nothing-to-watch).

The explorer, cloud API/database, website movie guide, movie details/connections, watchlists/preferences, trailers/viewing links, and group shortlists/voting are implemented and deployed. They run independently of the owner's device. **Only SMS account/number activation is intentionally deferred**, at the user's explicit request: “just keep that as the only unfinished piece … connect the number tomorrow.” The SMS code is deployed and unit-tested, but no actual phone delivery has been verified. Follow [CONNECT-SMS.md](CONNECT-SMS.md) next.

## Verification

- Ten Node tests pass: catalog/search/runtime constraints, graph credit provenance and paths, ranking, isolated persisted sessions, origin/body checks, group vote upsert, atomic limits, Twilio signatures/STOP/deduplication, Gemini tools/history, and bounded overload fallback.
- Browser checks passed for Voroforce rendering, search, save, detail credits/connections/providers, group link/vote, compact shortlist detail cards, and phone-width guide/explorer layouts.
- Production checks passed on 2026-10-15 at 22:04 UTC for public services/search, live provider data, D1 preferences, shared votes, real Gemini tools and chat history. See [PRODUCTION-VERIFICATION.json](PRODUCTION-VERIFICATION.json).
- Reusable production check: `node scripts/smoke-production.mjs https://black-cinema-atlas.fresh-cream-7054.chatgpt.site --chat`. It uses a fresh anonymous session, creates a test group, and clears its test history/preferences. No credentials are read by the script.
- Automatic GitHub Actions is **not enabled**: the authenticated OAuth app lacks `workflow` scope. `docs/github-actions-template.yml` is ready to install when that permission is deliberately granted. Tests/builds were run before publication.
- Runtime dependency audit reports no known vulnerabilities; four moderate advisories remain in development-only Drizzle tooling. Do not use a breaking audit-force downgrade.

## Hosting and credentials

- Reuse `.openai/hosting.json`: project `appgprj_6ad1029b4b308191b4786026d9f87b43`. **Never create a duplicate Site.** Audience is public as requested.
- Last application publication at this checkpoint: source `a28b06ae600f749d93c85d97bdbf5da82371d819`, version 3 `appgprj_6ad1029b4b308191b4786026d9f87b43~appgver_30e4657c749081918638e6625c400662`, deployment `appgdep_6ad14de7ab988191b3351afb7b2086b6`, environment revision 3. Subsequent documentation-only checkpoint may have a newer saved version; inspect current Sites state before updates.
- TMDB and Gemini secrets are configured in Sites and in ignored `.env.local`. No OpenAI key is needed. No local AI process is used. OpenCode's free service rejects external apps; do not use it.
- Production model is `gemini-2.5-flash-lite`, fallback `gemini-2.5-flash`. Early Flash requests returned provider HTTP 503 demand errors. Bounded retries/fallback were added and the hosted guide then passed. Rate-limit responses remain errors; no paid-service upgrade was activated.
- `PUBLIC_ORIGIN` is set. `SMS_ENABLED=false`. Twilio auth token and phone remain to be connected. User's Twilio browser was at the final payment step when they deferred it; leave that flow to them.
- Use native Sites environment tools for secrets and redeploy a saved version to apply them. Never place secrets in source, `.openai/hosting.json`, browser storage, helper arguments, logs, or output.

## Source continuity

Push meaningful checkpoints to GitHub's main branch, and publish website code edits through the Sites skill/source helper using the exact pushed commit and matching archive. The helper uses the supplied remote without overwriting GitHub origin. Keep credentials in session memory/stdin. Configure source credentials anew when expired.

Checkpoints: `3059f33` initial complete build; `e4b1730` tests/filter schema and CI permission workaround; `408cd21` first-publication diagnostics; `a28b06a` provider resilience and production-check script. Source and documentation are available on GitHub even if this agent session ends.

## Architecture and product limits

- React/Vite frontend; original Voroforce engine adapted for live RGBA poster sheets. Poster wall supports still/keyboard browsing. Canvas sorting uses decade/director/primary-theme groups on the original lattice, not embedding-based layout.
- `atlas/graph.mjs`: film/person/genre/theme/city/decade nodes and typed relationships. Credits come from TMDB; themes/settings are editorial. Graph tools and visual detail connections use the same relationships.
- `atlas/service.mjs`: API, movie cache, Gemini tools, sessions, groups/votes, secure SMS webhook. `atlas/worker.mjs`: cloud entrypoint/assets/media proxy.
- D1 owns persistent preferences/history/cache/groups. `db/schema.ts` and immutable `drizzle/` migrations own schema. Append migrations after deployment. Local preview uses Node SQLite in ignored `work/`.
- The 95-film collection is an editorial starter, not every Black film or an automated ethnicity classifier. Metadata/provider data refresh live with a six-hour cache. Streaming is country-specific and verified before subscription matches are claimed; absence/failed refresh is not treated as availability.
- Guest data follows an HttpOnly cookie; Sites account sign-in uses platform identity across devices. Web/SMS histories remain separate. Chat history older than 30 days is excluded and cleaned on new chat writes. Group links are shareable to anyone holding the link; use nicknames rather than private information.
- AI is subject to provider availability/quotas. App caps: 200 turns/day globally, 8/minute, 40/web user/day, 20/SMS user/day. A turn can contain multiple model/tool requests. This is not unlimited free traffic.
- REA MCP calls failed with transport errors; pinned CLI exhausted memory. No Evidence IDs. [REA-FINDINGS.md](REA-FINDINGS.md) explicitly distinguishes manual shipped-byte findings from successful REA execution. Original source was forked and reused.

## Commands

Node 24+: `npm ci`, `npm test`, `npm run build`, `npm run dev` (local port 3000). Server runtime secrets are separate from build output. `dist/server/index.js` bundles assets/seed; `dist/drizzle` includes migrations. `docs/upstream-bun.lock` preserves the original lock; npm owns the active lock. Preserve upstream license and shader attribution, including noncommercial/share-alike conditions.
