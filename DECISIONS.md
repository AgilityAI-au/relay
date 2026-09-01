# DECISIONS.md

## The gate

Record a decision here **only** if its `Impact` is one of `timeline`, `scope`, `risk` or
`commercial`. If you cannot pick one, it is not a decision — it is a note on the ticket.

That constraint is the whole design. An unorganised decision log is worse than none; this one
stays thin because most things are correctly refused entry.

## Entry format

```
### D-### · <one-line what was decided>
- Date · Status · Impact
- Why: one line
- Refs: tickets, docs
```

`Status` is `decided` or `open`. Open entries are live questions, not deferred ones.

---

### D-001 · Evolve the existing build; v4 is a new file pair, not a rewrite
- 2026-08-30 · decided · scope
- Why: v3's primitives (shared selection, derived epics, inline auto-save, lossless round-trip)
  are proven. The cost is in the render layer and the data model, not the language. A new pair
  keeps v3 runnable while v4 is half-built.
- Refs: CLAUDE.md, DESIGN.md §10

### D-002 · Stay zero-install: single HTML + JS, opened over `file://`
- 2026-08-30 · decided · scope
- Why: someone must understand this in 2–3 minutes from a link. ES modules are CORS-blocked over
  `file://` and any framework means `npm install` plus a dev server, which also breaks the
  no-CLI rule. The constraint is the product, not a limitation of it.
- Refs: CLAUDE.md "Hard constraints"

### D-003 · Split status into two axes: `stage` (plan|build) × `state` (todo|doing|review|done)
- 2026-08-30 · decided · scope
- Why: the old six-column status conflated where work sits in the thinking with how it is
  progressing. Separating them gives four columns instead of six (less intimidating) while
  carrying more structure via swimlanes. Maps 1:1 onto JIRA/Azure DevOps if a team ever
  graduates.
- Refs: AGENTS.md §3, DATA-MODEL.md §6

### D-004 · `blocked` and `deferred` are flags, not states
- 2026-08-30 · decided · scope
- Why: both can apply at any state. Modelling them as columns wasted horizontal space and lost
  the information that a blocked ticket is still mid-build.
- Refs: AGENTS.md §3

### D-005 · Revision is a separate field; ticket `id` never changes
- 2026-08-30 · decided · risk
- Why: test evidence must bind to a version of the ticket, but folding the revision into the id
  (`T-004.003`) breaks every cross-reference — `depends_on: T-004` becomes ambiguous. Separate
  `rev` field, displayed alongside the id.
- Refs: AGENTS.md §4

### D-006 · Test status is derived, with an explicit `stale` state
- 2026-08-30 · decided · risk
- Why: the real failure is an agent reading a genuine pass from an earlier revision and assuming
  the work is done. Comparing last-passed rev against current rev makes that visible instead of
  silent. Agents must treat `stale` as untested.
- Refs: AGENTS.md §4

### D-007 · Testing is not a third stage; it is `state: review` plus an append-only Test Log
- 2026-08-30 · decided · scope
- Why: a third lane triples board height for something already represented, and few tickets would
  occupy it at any moment. The Test Log makes testing first-class without a lane.
- Refs: AGENTS.md §4

### D-008 · One file per ticket in `tasks/`, plus a generated index
- 2026-08-30 · decided · scope
- Why: per-ticket git history becomes real instead of buried in 58 KB whole-file diffs; merge
  conflicts approach zero; reading one ticket costs one ticket. Independently converged on by
  Backlog.md and kanban-md. The files are a table; the index is a materialised view — so the
  later move to a database changes nothing about the model.
- Refs: AGENTS.md §1, §8

### D-009 · YAML frontmatter replaces the dash-list field format
- 2026-08-30 · decided · risk
- Why: the current custom parser drops fields silently on formatting deviations (mitigated only
  by an `extra_lines` escape hatch). Frontmatter parses reliably and is what the comparable tools
  use. Body stays plain Markdown, so tickets remain hand-editable.
- Refs: AGENTS.md §3, DATA-MODEL.md §5

### D-010 · `AGENTS.md` is the single folder contract, read by both the app and agents
- 2026-08-30 · decided · scope
- Why: file names, option lists and the tool library declared once, consumed twice. Stops the
  folder structure drifting from what the AI expects, and lets the board configure itself against
  any project folder rather than being hardcoded to this one.
- Refs: AGENTS.md

### D-011 · Deferral is an idea pipeline; the Parked view groups by reason, not date
- 2026-08-30 · decided · scope
- Why: the reason work was parked is the signal. Several items parked for `size` implies missing
  decomposition; several for `complexity` implies a spike is needed. Grouping by reason is what
  lets deferred ideas be revisited to spawn better versions.
- Refs: AGENTS.md §5

### D-012 · Git for history, plus a read-only published snapshot; no hosted store yet
- 2026-08-30 · decided · scope
- Why: two of the three ways git breaks for a team are read-only problems — a PM won't `git pull`,
  and a scrum needs shared visibility. A self-contained generated HTML snapshot covers most of the
  collaboration need at a fraction of the complexity. Build a hosted store only when someone other
  than Will needs to *write*.
- Refs: CLAUDE.md

### D-013 · Move the repo out of iCloud Drive before splitting into `tasks/`
- 2026-08-30 · **open** · risk
- Why: iCloud sync conflicts produce duplicate `... 2.md` files throughout this corpus. Going from
  1 backlog file to ~50 multiplies that surface, inside a git working tree. Needs Will's call —
  it also affects how the repo gets shared.
- Refs: ../CLAUDE.md

### D-014 · Merge with ADL and News-Feed is deferred; keep the context tiers structurally parallel
- 2026-08-30 · decided · scope
- Why: all three are worth building separately first. But ADL's skeleton/synthesised/raw tiering
  is the same problem as index-first task loading, so keeping the tier boundaries aligned now
  makes the eventual merge a join rather than a rewrite.
- Refs: AGENTS.md §8, CLAUDE.md "Where this is going"

### D-015 · The demo backlog is embedded and loads on open; no file picking to see the board
- 2026-08-30 · decided · scope
- Why: the showcase requirement is comprehension in 2–3 minutes. Any step between opening the file
  and seeing a populated board loses people. The demo is authored as real v4 Markdown and parsed by
  the real parser, so it doubles as a format example and a parser exercise rather than being a
  hardcoded fixture.
- Refs: kanban-4.js `VIBE_SEED`, seeds/generate.py

### D-016 · Test evidence logic is guarded by a dev-only node harness
- 2026-08-30 · decided · risk
- Why: stale-test detection is the feature most likely to break silently, and a wrong answer there
  is worse than no answer — an agent would trust an invalid pass. Node is a development
  dependency only; the product remains zero-install.
- Refs: test/parse-test.js, AGENTS.md §4

### D-017 · Adopt SAFe / JIRA / Azure DevOps vocabulary: Epic → Feature → Story → Task
- 2026-08-30 · decided · scope
- Why: the target use is hybrid agile on large SAP programmes, where this hierarchy is already the
  shared language — it is the Azure DevOps *Agile* hierarchy exactly. Costs one optional `epic`
  label; Story vs Task is derived from `parent`, so nothing new is authored. Anything the board
  shows a scrum master or RTE should be a word they already use.
- Refs: AGENTS.md §2, DATA-MODEL.md §6

### D-018 · WSJF is supported but optional, and derived
- 2026-08-30 · decided · scope
- Why: WSJF is the most recognisable SAFe prioritisation artefact and answers "what next" better
  than P0/P1/P2 alone. Making it four optional scores that compute a derived value means large
  programmes get it and small boards never see it. Score all four or none — a partial set is
  ignored rather than producing a misleading number.
- Refs: AGENTS.md §3.4, kanban-4.js `wsjf()`

### D-019 · Density levels differ by how many FIELDS a card shows, not how much text
- 2026-08-30 · decided · scope
- Why: the first attempt varied only the goal excerpt's line-clamp, so Standard and Full looked
  identical whenever goals were short — which is most of the time. Full now adds PI, epic,
  criteria count, dependencies and tools. Progressive disclosure has to disclose something.
- Refs: kanban-4.js `cardHTML()`, kanban-4.html density rules

### D-020 · A dependency in `review` is not met
- 2026-08-30 · decided · risk
- Why: surfaced by a failing test assumption. `review` means claimed done but not yet accepted by
  a human, so treating it as satisfied would let work start on an unapproved foundation. Only
  `done` clears a dependency.
- Refs: AGENTS.md §3, test/parse-test.js

### D-021 · The index is generated one-way and agents may never write it
- 2026-08-30 · decided · risk
- Why: the genuine risk in having both story files and an index is two places drifting. That risk
  only exists if the index cannot be rebuilt. Making it strictly derived — one-way, regenerated by
  the board on save, with a story count in its header so drift is detectable — turns it from a
  second source of truth into a cache. Backlog.md avoids the problem by computing listings on
  demand through its CLI; with no install available to us, a generated file is the equivalent.
- Refs: AGENTS.md §9, demo/generate.py

### D-022 · Archive on done-and-aged; parked work stays in place
- 2026-08-30 · decided · scope
- Why: `tasks/archive/` keeps the active folder small without losing anything — git retains every
  version and the files stay greppable. Deferred work deliberately does **not** move, because it is
  an idea pipeline meant to be revisited (D-011); filing it away would quietly defeat that. Physical
  location controls permanence, index sections control attention.
- Refs: AGENTS.md §9

### D-023 · The Docs view reports missing documents, not just present ones
- 2026-08-30 · decided · scope
- Why: a plain file list is a viewer. Naming the documents a project is *expected* to carry, and
  showing which are absent with a line on why each matters, turns the same panel into a project
  health check — and into the teaching surface for someone who has not done this before. The
  markdown renderer is ~110 lines of plain JS, so it costs no dependency.
- Refs: kanban-4.js `DOC_SLOTS`, `docHealth()`

### D-024 · Project bootstrap ships as a seeded backlog, not a wizard
- 2026-08-30 · decided · scope
- Why: setting a project up *is* a project, so it should be worked on the same board with the same
  Epic → Feature → Story mechanics. The user learns the tool by using it on their own setup, the
  pacing is visible, each story produces one real file with acceptance criteria, and the Docs
  health panel is the scoreboard. A wizard would have taught nothing and needed new machinery.
- Refs: `BOOTSTRAP_SEED` in kanban-4.js, seeds/start/, skills/start-project/

### D-025 · Seeds are generated into complete copyable project folders
- 2026-08-30 · decided · scope
- Why: the same seed has to serve three jobs — an instant in-board demo, a folder a user copies to
  start real work, and a fixture the parser is tested against. Generating full folders (docs at the
  root, one story per file under `tasks/`, a generated INDEX) from one source array in the board
  satisfies all three without duplication.
- Refs: seeds/generate.py, seeds/README.md

### D-026 · Distribute as a Claude Code plugin; the kit folder is already the plugin
- 2026-08-30 · decided · scope
- Why: a Claude Code plugin is a directory with `.claude-plugin/plugin.json` plus `skills/`, and a
  marketplace is a git repo with `marketplace.json`. That means the "copy this folder" kit and the
  "install this plugin" distribution are the *same artefact* — no second build. `claude plugin
  validate .` already passes, so the plugin path is open whenever we want it rather than being a
  rewrite.
- Refs: .claude-plugin/plugin.json, skills/

### D-027 · A drop target is a (state, lane) pair, not just a column
- 2026-08-30 · decided · scope
- Why: with swimlanes on, every column exists once per lane, so a drop already carries two pieces
  of information. Using both means Plan/Review → Build/To Do promotes a story into build in one
  gesture, and in Actor lanes **a drag between AI and Human is the handoff** — the most important
  action in the tool becomes its most direct one. The editor dropdowns stay as the keyboard path.
- Refs: kanban-4.js `applyDrop()`, DESIGN.md §10

### D-028 · Dragging a parked story un-parks it; a blocked one stays blocked
- 2026-08-30 · decided · risk
- Why: AGENTS.md §5 forbids working from `deferred`, so a drag onto the board has to clear the
  hold or it would create the illegal state the rule exists to prevent. `blocked` is different —
  it describes the world, not a choice, so it survives the move and stays visible. Found by a
  failing test: the original ordering returned early when the column was unchanged, which silently
  did nothing to a parked card.
- Refs: kanban-4.js `applyDrop()`, test/parse-test.js

### D-029 · The default demo is vibe coding an app with Claude Code, not a generic project
- 2026-08-30 · decided · scope
- Why: the first seed anyone sees is the shop window, and a generic customer portal says nothing
  about what this tool is *for*. Building a real app with Claude Code — idea to shipped in two
  sessions — is the story worth telling, and it lets the board carry the honest parts of AI-assisted
  work rather than an idealised version: the ten minutes of actually *using* the thing (T-011),
  the colour choice only a human can make (T-013), and the ship-it story with the highest WSJF
  that is most likely to be quietly postponed (T-015).
- Refs: kanban-4.js `VIBE_SEED`, seeds/vibe/

### D-030 · `increment` is free text, and the demo proves it
- 2026-08-30 · decided · scope
- Why: SAFe calls it a Program Increment, but the field is just a label. The SAP seed uses PI-1/2/3
  and the vibe seed uses Session 1 / Session 2 / Later — same field, same swimlane axis, no code
  difference. The toolbar button was renamed from "PI" to "Increment" so the UI does not imply a
  vocabulary the field does not enforce.
- Refs: kanban-4.js `laneGroups()`, kanban-4.html toolbar

### D-031 · The plan view spans increments, not dates
- 2026-08-31 · decided · scope
- Why: a Gantt appears to need dates, but it only needs *ordering* — which is what we chose over
  measurement. A bar runs from the first increment containing a node's work to the last. Nine
  sprints means nine future date entries if calendar time is ever wanted, against thousands if
  stories carried dates. Plan-on-a-page and Gantt turn out to be one view at two zoom levels, so
  it is one build, not two.
- Refs: kanban-4.js `planHTML()`, ROADMAP.md

### D-032 · No categorical colour in the plan view
- 2026-08-31 · decided · scope
- Why: our status tokens already occupy green, amber, blue, red and violet, and the accent owns
  orange. Any series palette would impersonate a state — the exact anti-pattern that makes charts
  lie. Identity comes from the row label and its band; the bar encodes extent (position) and
  progress (fill) only. The dark status trio also fails the lightness band as large fills, so the
  progress fill runs at ~28% opacity rather than solid.
- Refs: kanban-4.html `.pg-fill`, dataviz palette validation

### D-033 · Plan rows cascade by start, then by end
- 2026-08-31 · decided · scope
- Why: found by a failing test. Alphabetical ordering put "Making It Good" above "The App" — the
  polish phase above the build phase. Ordering bands and rows by where work starts, breaking ties
  on where it ends, produces the top-left-to-bottom-right cascade every Gantt reader expects and
  puts "Shape It" above "Core Features" without anyone declaring an order.
- Refs: kanban-4.js `planRows()`, test/parse-test.js

### D-034 · Every view container declares its own [hidden] rule
- 2026-08-31 · decided · risk
- Why: `.body` carries `display: grid`, and an author `display` declaration beats the user-agent
  `[hidden] { display: none }`. So setting `hidden` on it did nothing and the board stayed on
  screen behind Docs, squeezing the docs pane into an implicit grid row. `.planview` and
  `.docsview` happened to have explicit rules; `.body` did not. A test now asserts all three have
  it, because a fourth view would hit exactly the same trap.
- Refs: kanban-4.html `.body[hidden]`, test/parse-test.js

### D-035 · Renaming a label changes display only, never the data
- 2026-08-31 · decided · risk
- Why: the settings panel lets a project call `doing` "Realize" and a Story a "Requirement", which
  is what makes one board serve a weekend app and an S/4HANA programme. But the files must keep
  `state: doing`, or a relabelled backlog stops being readable by any other board or agent and the
  format fragments. Display is a view concern; the stored value is the contract. Tests assert the
  serialised value survives a rename.
- Refs: kanban-4.js `lbl()`, test/parse-test.js

### D-036 · Settings live in localStorage per project, with a one-click export to AGENTS.md
- 2026-08-31 · decided · scope
- Why: settings belong with the project, not the browser — but the board cannot write AGENTS.md
  yet. Storing them per project keyed on the source, plus a "Copy as AGENTS.md block" button that
  emits the same values as YAML, gets the benefit now without pretending to a capability we do not
  have. When the board can write the contract file, the export becomes a save.
- Refs: kanban-4.js `settingsAsYaml()`, ROADMAP.md

### D-037 · The tool is called Relay
- 2026-09-01 · decided · scope
- Why: the distinctive thing is not the board, it is that work passes between an AI and a
  person and the handover is visible. A relay names exactly that, reads as a way of working
  rather than a product category (which suits demo-not-product positioning), and a project
  manager understands it with no explanation. "Handoff" was the obvious alternative and is
  wrong — in lean and agile a handoff is something you try to reduce.
- Refs: LAUNCH.md §0a, .claude-plugin/plugin.json

### D-038 · Four routes, ordered by cost, with a paste route so nobody is blocked
- 2026-09-01 · decided · scope
- Why: Cowork and Claude Code both need a paid plan; publishing to an audience that mostly
  has none would send them at a paywall unannounced. Ordering by cost — Look, Use, Paste,
  Connected — means everyone can reach at least the third rung. Codex's free tier makes the
  connected route reachable too, which inverts the obvious vendor ordering.
- Refs: LAUNCH.md §1

### D-039 · v3 and the legacy TASKS.md move to archive
- 2026-09-01 · decided · scope
- Why: CLAUDE.md set the trigger as "once v4 has the editor and save path" — it does. Keeping
  a second runnable build at the root invites edits to the wrong file, and `TASKS.md` was
  superseded sample data carrying personal detail that must not reach the public repo.
  Archived, not deleted; git keeps everything regardless.
- Refs: archive/versions/, archive/TASKS.md

### D-040 · The bridge enforces three guarantees rather than trusting the assistant
- 2026-09-01 · decided · risk
- Why: the paste route means any AI on any plan can return a story, so the contract cannot rely
  on the assistant having followed instructions. Three rules are enforced on the way back in:
  the id never changes; Test Log entries are only ever appended, never removed; and nothing
  arrives `done` — a reply marked done is forced to `review` with the override explained. Every
  override is shown in the diff, so the board never silently rewrites what the AI said.
- Refs: kanban-4.js `diffStory()` / `applyReply()`, test/parse-test.js

### D-041 · The reply is reviewed as a diff before anything is applied
- 2026-09-01 · decided · risk
- Why: pasting untrusted text straight into a story would be the same mistake as letting an AI
  mark its own work done. The board parses the reply, shows field-by-field what would change,
  and does nothing until a person clicks Apply. It also keeps the story dirty afterwards, so
  saving to disk stays a separate deliberate act.
- Refs: kanban-4.js `checkReply()` / `commitReply()`

### D-042 · The About page ships with the board, not with any project
- 2026-09-01 · decided · scope
- Why: three different readers were competing for the name README.md — GitHub's landing page,
  a project's own readme, and "what is this tool and how do I use it". Making the third an
  embedded document removes the collision entirely: it is present whatever folder you open,
  including one with no readme, and a project's README.md stays the project's. Toggleable off
  in Settings once someone no longer needs it.
- Refs: kanban-4.js `ABOUT_DOC`, LAUNCH.md

### D-043 · The vibe seed is a tutorial, not an example project
- 2026-09-01 · decided · scope
- Why: "Recipe Box" was an arbitrary topic — a reader who does not care about recipes learns
  nothing from watching one get built. Rewriting the seed so the *stories are the steps of
  learning to work with an AI* makes it useful regardless of what the reader wants to build,
  and it teaches the board at the same time as the craft. What gets built is left to the
  reader, because a specific app would be somebody else's project. It hands off to the
  "Start a new project" seed at T-014.
- Refs: kanban-4.js `VIBE_SEED`, seeds/vibe/

### D-044 · The board writes tasks/INDEX.md on every save
- 2026-09-01 · decided · risk
- Why: splitting a backlog into one file per story only pays if the index is trustworthy, and
  until now nothing wrote it — a user could open a folder, edit, save, and leave the index
  describing a backlog that no longer existed. A stale index is worse than none because an
  agent believes it. The board now owns the file, and its header carries a story count and a
  date so drift is detectable rather than silent.
- Refs: kanban-4.js `buildIndex()`, AGENTS.md §9

### D-045 · `actor` gains a third value, `Both`
- 2026-09-01 · decided · scope
- Why: some work is genuinely a conversation rather than a task — writing the project files
  is the clearest case: the human steers, the AI writes, and it is never quite finished.
  Forcing it to one owner misrepresents it. `Both` gets its own swimlane and is never
  "ready to dispatch", because it always needs a person. This is the first step of the
  declared-actor-vocabulary idea that third-party actors will finish.
- Refs: kanban-4.js `ACTORS`, ROADMAP.md

### D-046 · AI working notes need no parallel system
- 2026-09-01 · decided · scope
- Why: an assistant generates intermediate state a human does not want in their backlog, and
  the instinct is a second store. Three existing mechanisms absorb it instead: decomposition
  becomes sub-tasks that level zoom already hides; orientation notes sit in the story;
  continuity comes from the board being accurate. If an AI needs a private journal to stay
  oriented, the board is not being maintained — and that is the thing to fix, not to route
  around.
- Refs: AI-HUMAN-WAYS-OF-WORKING.md

### D-047 · Save asks for a folder; it never downloads on its own
- 2026-09-01 · decided · risk
- Why: with no folder open, Save fired one download per changed story plus INDEX.md, which
  trips Chrome's "allow multiple downloads?" prompt on the second file. To a first-time visitor
  that reads as the page misbehaving — the worst possible moment for it, since it happens the
  first time someone tries to keep their work. Save now opens the folder picker, which is a
  dialog everyone recognises. Cancelling writes nothing. The first save into a fresh folder
  writes every story plus the project's documents, so the result is a real project rather than
  a bag of files.
- Refs: kanban-4.js `saveAll()` / `chooseFolder()`

### D-048 · Sample edits persist in the browser
- 2026-09-01 · decided · scope
- Why: edits lived only in memory, so a reload lost them — which is what made Save feel urgent
  enough to reach for and pushed people onto the download path. Drafts are kept per sample in
  browser storage, restored on load with a visible "your edits were restored · discard them"
  notice. Only for the built-in samples: when a real folder is open the files are the truth and
  a draft beside them would just be a competing answer. The close-tab warning now fires only in
  folder mode, because nothing else is at risk.
- Refs: kanban-4.js `scheduleDraft()` / `readDraft()`

### D-049 · One deliberate export, for the browsers that cannot open a folder
- 2026-09-01 · decided · scope
- Why: Safari and Firefox have no directory picker, so downloading is their only way to get work
  out — it cannot simply be removed. But it is now one file, asked for from Settings, never
  several fired automatically. A single download does not trigger the multi-download prompt at
  all. Re-importing that file is not supported yet; the separators mark the boundaries so it can
  be split by hand or by an AI.
- Refs: kanban-4.js `exportOneFile()`, ROADMAP.md

### D-050 · Both folder dialogs share one picker id
- 2026-09-01 · decided · scope
- Why: the picker was called bare, so every dialog opened at Documents regardless of where the
  user actually works. Giving Open and Save the same `id` makes the browser reopen wherever
  that id was last used — so Save starts in the folder you opened, which is almost always where
  you want it. `startIn` takes priority while a handle from the current session is still held.
  One shared `pickerOptions()` so the two cannot drift apart.
- Refs: kanban-4.js `pickerOptions()`

### D-051 · Grid panes are placed explicitly, not by auto-placement
- 2026-09-02 · decided · risk
- Why: below 1040px the rail was hidden with `display: none`, which removes it from the grid
  entirely. The board then auto-placed into the `0px` first column and an empty detail pane took
  the `1fr` — a blank board on any laptop in split screen or a non-maximised window. Found by a
  hands-on review, invisible to 227 headless assertions. Rail, board and detail now declare their
  own `grid-column`, so hiding any of them cannot reshuffle the others. The reason is written
  beside the media query and asserted in the suite.
- Refs: kanban-4.html `.rail/.board/.detail`

### D-052 · `--faint` clears AA; the density stays
- 2026-09-02 · decided · risk
- Why: `--faint` measured 2.81:1 dark and 2.89:1 light — below AA (4.5) and below even the
  large-text floor — while carrying chips, story IDs, column subtitles and the footer. The
  reviewer's remedy was 12px minimum type, which would have undone the density that makes this
  not look like a generic AI-built site. Measurement showed the problem was contrast, not size:
  `--dim` already passed at 5.5/5.9 on the same scale. Moved the token to #7e7e8a / #6d6d79,
  clearing AA on both panel and sunken while staying below `--dim` so the three-level hierarchy
  survives. Type sizes unchanged.
- Refs: kanban-4.html tokens, test/parse-test.js

### D-053 · A restored draft marks only what changed
- 2026-09-02 · decided · scope
- Why: restoring a draft flagged every story dirty. Convenient for writing the whole set on the
  next save, but it told the user 21 stories were edited when one was — and "edited" is a signal
  that has to stay honest. The draft now records which ids were dirty. Saving still writes
  everything on a first save to a fresh folder, because that is a separate concern.
- Refs: kanban-4.js `writeDraft()` / `loadSeed()`

### D-054 · Column subtitles and the About page must not overstate
- 2026-09-02 · decided · risk
- Why: two small untruths, both found by hands-on review. The To Do column read "Ready to pull —
  nothing blocking it" while containing stories with unmet dependencies. The About page said a
  connected AI edits files "and the board shows the result", implying a live refresh that does not
  exist. For a tool whose argument is that accurate files beat chat history, copy that overstates
  is worse than a missing feature.
- Refs: kanban-4.js `STATES`, `ABOUT_DOC`, release/README.md

### D-055 · The board keeps its columns on a phone and scrolls sideways
- 2026-09-02 · decided · scope
- Why: the grid fix stopped the blank board but left the page unusable on a handset — the topbar
  had no wrap and no overflow inside `body { overflow: hidden }`, so its buttons were clipped and
  unreachable. The topbar now scrolls; header counts and keyboard hints drop out at 720px; at
  560px one board column fills the screen so you swipe between states, which is how every mobile
  Kanban behaves. Hiding the keyboard hints also removes "drag a card to move it", which is false
  on touch — HTML5 drag is pointer-only, and the editor's state dropdown is the touch path.
- Refs: kanban-4.html media queries

### D-056 · Untested on a real handset, and it says so
- 2026-09-02 · decided · risk
- Why: the mobile rules were written from reading the layout, not from a device. That is worth
  stating in the file rather than implying coverage the work does not have — a comment sits above
  the breakpoints saying to verify before relying on it.
- Refs: kanban-4.html
