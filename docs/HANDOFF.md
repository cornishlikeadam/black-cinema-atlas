# Agent handoff — Black Cinema Atlas

Last updated: 2026-10-15. This file and GitHub checkpoints are the continuity record if the current agent session ends. Never ask the user to paste API keys in chat, print `.env.local`, or commit credentials.

## User intent and authorization

Build the complete cloud-hosted Black cinema explorer, original Voroforce visual engine, dynamic TMDB data, Gemini website chat, group movie night, watchlist, and a real SMS agent. User wants the app usable by other people without their computer running. Keep GitHub and the live site updated. Use REA to investigate the example and honestly document any limits. User specifically asks for GitHub updates at every meaningful step so another agent can continue.

## Source and hosting identity

- GitHub: https://github.com/cornishlikeadam/black-cinema-atlas (fork of gnovotny/nothing-to-watch).
- Site project: `appgprj_6ad1029b4b308191b4786026d9f87b43`, already registered. **Do not create a duplicate Site.** Reuse `.openai/hosting.json`.
- Site slug: black-cinema-atlas. First deployment is pending at this checkpoint. Site currently owner-private; the user wants public usage, so publish with public access when ready.
- Use the Sites skill/source helper for source push, exact-commit packaging, version save and deployment. Preserve GitHub origin when adding the Sites source remote. Push both repositories after each meaningful change.

## Implemented

Original Voroforce rendering now works with runtime RGBA poster sheets, using a real TMDB-backed 95-film starter collection. Search, filters, detail modal, credits, connection graph, trailers/provider links, Gemini tool calls, cloud schema, watchlists, group votes and secure Twilio webhook are implemented. Local API and interface run at port 3000. Production bundle has built successfully once; source changed since that build.

Live credentials for TMDB and Gemini were saved by the user in ignored `.env.local`; both providers were successfully tested. No OpenAI key is needed. OpenCode's free endpoint explicitly disallows third-party app use; do not use it. No local AI service belongs in the final deployment.

REA MCP calls failed with transport errors; pinned CLI ran out of memory. No successful Evidence IDs. `docs/REA-FINDINGS.md` records only manual inspection of captured shipped bytes and exact limitations.

## Pending work, in order

1. Complete meaningful API/security/graph tests and browser interaction QA. Rebuild after changes. Check responsive layout and film details opened from compact chat/group cards.
2. Finish dependency update verification (critical inherited Vitest/texture-compressor dependencies were updated/removed; only development-tool moderate advisories remained in lockfile audit). Tests do not exist yet at this checkpoint.
3. Configure hosted Gemini/TMDB secrets using native Sites tools, never plaintext output. Set PUBLIC_ORIGIN to the exact Site origin. Keep SMS_ENABLED=false until activation.
4. Package/push exact source with Sites workflow, save version and deploy. Apply hosted D1 migrations through publication. Switch the intended audience to public and verify unauthenticated site/API, database preferences and real Gemini tools on production. No production deployment is verified yet.
5. Continue Twilio setup. User created trial account. Account SID is present locally; auth token and phone number were blank last checked. Inventory showed no verified active number; re-check rather than assume. Latest browser has redirected to Twilio login. Do not buy a number/upgrade/accept binding terms without the required user action/approval. Prepare exact webhook and account steps first. Only claim SMS live after inbound and outbound verification.
6. Update this handoff with deployment URL, tested behaviors, remaining blockers, and checkpoint SHA, then push GitHub again.

## Design/runtime notes

The collection is editorial, not every Black film. Metadata refreshed on detail requests is cached 6 hours in D1. Layout currently sorts by decade/director/primary theme on the original lattice; it is not an embedding-based layout. Graph connections are separate verified credits/editorial tags. Live providers are checked for subscription filtering; no invented availability. Guest data follows cookie; account sign-in follows Sites identity. SMS/web histories are separate. AI free tier is quota-limited, not unlimited free public traffic.

Use `npm test` for Atlas Node tests once present; `npm run build` for Worker packaging; `npm run dev` for local Vite/API/SQLite. Only the local preview needs Node's SQLite. The cloud Worker uses D1. Secret files, generated bundle and local database are ignored.
