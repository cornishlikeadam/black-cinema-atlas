# Reference reconstruction evidence

Investigation date: 2026-10-15. Scope: the publicly shipped app at
https://nothing-to-watch.port80.ch/, limited to its poster pipeline, lattice,
and selection integration. No accounts, unrelated apps, or credentials were inspected.

## Evidence status

The REA `analyze_javascript_application` tool was invoked once against a local
capture of the production HTML and main JavaScript bundle. It returned
`Transport closed` without an Evidence record. One subsequent REA
`binary_session` call returned the same error. The skill's pinned CLI fallback,
`rea-agents@6.3.0 analyze-javascript-application`, was then attempted once on
the same capture. It began parsing the main bundle but exhausted Node's
approximately 4 GB heap and exited with code 134. Its redirected output file
`work/reference-rea-cli.json` remained empty. **No REA Evidence ID was issued.**
The findings below are manual static inspection of captured shipped bytes;
they must not be described as successful REA analysis or observed execution.
No server installation or configuration repair was attempted.

No literal CDP endpoint was supplied for the reference, so no passive browser
capture was attempted. Frame rate, interaction feel, actual request ordering,
and graphics compatibility remain unverified at runtime.

## Artifact identity

- Public bundle: https://nothing-to-watch.port80.ch/assets/app-BRLS9bot.js
- Captured size: 707,810 bytes.
- SHA-256: `5d3e5a289f13df369d49a0f888dab632f82f72679771647ee3562320b6395b10`.
- Local capture and retrieval manifest: `work/reference-shipped/` in the parent
  workspace. Third-party analytics were excluded from the analyzed tree.
- Locations below are zero-based **character offsets** in the UTF-8-decoded
  minified bundle, not byte addresses or stable source line numbers.

## Findings and reconstruction implications

| Question | Shipped static evidence | Integration implication |
| --- | --- | --- |
| How are movie details loaded? | Around offsets 404,500–405,650, model conversion reads TMDB IDs, title, overview, comma-separated genres, release year, rating, poster, and backdrop. `wA` fetches `https://ntw-assets.port80.ch/json/${n}.json`; `qb` caches by `cell.subgrid` and reads `subgridIndex`. | Preserve stable film identity independently of renderer position. Replace the batch lookup with API detail retrieval and a cache. A filter rebuild must keep cell-to-film mapping synchronized. |
| How do posters reach WebGL? | Around 453,850–455,000, configuration specifies DDS `compressed-grid` media: low 512×104 cells / 1 layer; mid 90×60 / 10 layers; high 18×12 / 241 layers. The base is `https://ntw-assets.port80.ch/media` with version-specific layer paths. | A poster URL cannot simply replace this base URL: each layer contains many films whose UVs depend on cell/subgrid placement. Either generate matching atlases, or adapt the individual-image loader. |
| Is there an individual-image route? | Around 454,650, the optional `uncompressed-single` version has 220×330 tiles, virtual grid 9×6, 50 virtual layers, and `/single/{INDEX}.jpg` URL format. `Mu` appends this version to the compressed versions. Around 269,300–270,900, the loader also has an ordinary blob-to-Image branch. | Reuse virtual texture residency and uploads for dynamic posters, with a film-aware URL resolver. Ensure missing images and failed downloads release pending loads and display a fallback. This is a proposed adaptation, not a verified drop-in configuration. |
| Are connections semantic? | Around 394,900–396,500, `handleLattice()` links a cell to the previous row and column; neighbor calculation enumerates grid rings. Around 453,850 the lattice uses poster aspect 2/3. | The reference’s spatial neighbors do not establish shared actors, genres, or themes. Semantic clustering requires a new relationship-to-layout adapter. Preserve poster aspect and interaction while deriving arrangement from the graph. |
| How does focus populate the UI? | Around 480,350–480,900, both `focused` and `selected` events call the same cached detail function `qb`. Around 285,302, selection and focus maintain distinct indices and dispatch distinct events. | Use focus for quick previews and selection for expanded film details. Debounce or cancel asynchronous enrichment so a slow earlier response cannot overwrite the newly focused film. |
| What navigation should remain? | Around 295,750–296,500, `navigateToCellById` resolves an ID; arrow keys traverse the lattice; Space/Enter request selection. Touch code includes pinch zoom. Modes include preview, select, and intro, with different force/control configurations. | Retain keyboard activation, ID-based navigation, touch support, and mode transitions. Keep chat interactions from accidentally controlling the canvas. |

## Coverage and limits

The checklist is answered partially by static main-bundle inspection. The
bundle references additional worker assets and a lazy film-view module;
their implementation and execution were not analyzed in this pass. No source
map was declared by the captured main bundle. String/configuration presence
does not prove that a particular version is loaded in the active mode or that
every code path executes. Atlas dimensions describe shipped configuration,
not a verified count of unique usable films.

Use upstream source inspection to implement the adapters, then verify the
reconstruction in a real browser with dynamic films and failed-image cases.
A future successful REA pass can add genuine Evidence IDs and runtime
corroboration; this report deliberately preserves the current limitation.
