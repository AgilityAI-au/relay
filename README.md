# Relay

**Plan and run work with AI and people on the same board.**

AI runs a leg, you run a leg, and the handover is on the board where everyone can see it.

### [→ Try it live](https://AGILITYAI.github.io/relay/)

No sign-up, no install, nothing to download. Three sample projects are already loaded.

<!-- IMAGE: board screenshot, dark, actor lanes visible -->

> **This is a working demonstration of an idea, not a product.** It does real work — but it
> is here to show a direction, not to be finished software.

---

## Why it exists

When an AI does a large share of the building, the human job shifts to **deciding and
reviewing**. That needs somewhere to happen.

Most AI work happens in a chat window: long, unsearchable, invisible to anyone else, and gone
when the thread ends. Relay moves the durable part into ordinary Markdown files in a folder —
and then shows you that folder as a board you already know how to read.

Your AI edits the files. The board reads the same files. There is nothing in between, no API
and nothing to connect.

---

## What you are looking at

Open the live link and you get three sample projects. Switch between them at the top right.

| Sample | What it shows |
|---|---|
| **Vibe coding: a tutorial** | Twenty-one stories that teach working with an AI — the loop, and the habits that make it reliable instead of lucky. |
| **SAP S/4HANA programme** | Fit-to-Standard, master data, SIT/UAT and cutover, on a SAFe spine. The same board, an enterprise shape. |
| **Start a new project** | Ten stories that walk you and an AI through setting a project up properly. |

Things worth doing in the first two minutes:

- Press **L** to switch the lanes to **Actor**. AI work and human work, side by side in the
  same columns. That split is the whole idea.
- Find a card marked **⚠ stale**. It passed its tests — then the story changed, so the old
  result no longer covers it. That marker is the most useful thing here.
- Drag a card between columns. **Nothing on this page is a screenshot.**
- Open **Plan** for the same work as a plan on a page, and **Docs** for the project's own
  documents — including which expected ones are missing.

---

## Four ways to use it

Pick whichever rung you can reach. Nothing below the last one costs anything.

| | What you need | What you get |
|---|---|---|
| **1 · Look** | The link above | The samples, fully working. |
| **2 · Use** | Chrome, Edge, Arc or Brave | Download a project below, click **Open**, and edit your own stories. |
| **3 · Ask an AI** | Any chat — free accounts included | Select a story, click **Ask an AI**. The board writes the prompt; you paste it into ChatGPT, Claude or Gemini and paste the reply back. |
| **4 · Connected** | An AI that can read a folder | It edits the files directly and the board shows the result. |

> **Opening a folder needs a Chromium browser** — Chrome, Edge, Arc or Brave. Safari and
> Firefox can view the samples but cannot open a folder on your computer.

---

## Try it with your own AI

Five things you actually do:

1. **Make a folder** on your computer for this piece of work.
2. **Put the starter files in it** — download one below and unzip it there.
3. **Pick your AI and point it at the folder.**
4. **Talk about the work.** The chat is where the thinking happens; the AI writes it down.
5. **Watch the board.** Open the live link, click **Open**, and choose your folder.

### Three things to ask it

Paste these one at a time.

> Read AGENTS.md, then tasks/INDEX.md, and tell me which story is ready to start.

> Work that story. Follow AGENTS.md — stop at review and don't mark it done.

> Add a story for *(something you want)*, with a goal and acceptance criteria, then regenerate the index.

The second one is the one to watch. **The AI stopping is the surprise** — it finishes at
*review* and hands the work back, because a person accepts work, not the assistant.

### Which AI

Any tool that can read and write files in a folder.

- **VS Code plus an extension** — search the marketplace for *Claude Code* (Anthropic) or
  *Codex* (OpenAI). Both are made by the AI companies themselves, one click to install, and
  they appear as a chat panel beside your files.
- **Or the vendor's own app** — create a **local** project and point it at your folder. A
  cloud project cannot write to your computer.

Plans change often. At the time of writing Codex has a free tier and Claude's tools need a
paid plan — **check current plans before you spend anything.**

---

## Download a project

| Project | |
|---|---|
| **Vibe coding: a tutorial** | [`vibe-tutorial.zip`](projects/vibe-tutorial.zip) — learn the loop and the habits |
| **Start a new project** | [`new-project.zip`](projects/new-project.zip) — set your own project up properly |
| **SAP S/4HANA programme** | [`sap-programme.zip`](projects/sap-programme.zip) — an enterprise-shaped example |

Or browse them unzipped in [`projects/`](projects/).

---

## What the files are for

| File | Why it exists |
|---|---|
| `tasks/` | One story per file. Small, reviewable, and readable without any tool. |
| `tasks/INDEX.md` | Generated. One row per story so an AI can see the whole backlog cheaply and then open only the file it needs. Never edited by hand. |
| `AGENTS.md` | The rules an AI follows here — how to find work, what *done* means, what it must not do. Short, because every assistant reads it. |
| `CLAUDE.md` | Working context and house rules, with the reasons behind them. |
| `DECISIONS.md` | Choices that changed the timeline, the scope, the risk or the cost. Nothing else — that gate is what keeps it worth reading. |

[**AI-HUMAN-WAYS-OF-WORKING.md**](AI-HUMAN-WAYS-OF-WORKING.md) is the longer version: when to
write these files, how they fit together, and where an AI's own working notes should live.

---

## Why a board, and not just a list

A task list is a record of what happened. This is meant to be the opposite — a place where
**work is handed back and forth** and both sides can see the state of it.

Three things follow from that:

- **It has to be legible to someone who has never used an AI tool.** Familiar columns and
  lanes mean nobody has to learn a method before they can start.
- **Evidence has to be tied to a version.** The common failure with an AI is not a wrong
  answer — it is a right answer to the previous question. Test results are bound to a
  revision, so when a story changes its old results go *stale* rather than quietly looking
  valid.
- **The vocabulary should be one people already use.** Epic → Feature → Story → Task,
  enablers, increments, optional WSJF. It maps onto SAFe, Azure DevOps and SAP Activate, so
  it sits alongside whatever a team already runs rather than replacing it. Every label is
  renameable in Settings without touching the files.

---

## What this is not

No accounts, no server, no database, no multi-user. One person at a time. There is no
automated connection to an AI — you or your AI tool move the work.

It is a demonstration of an idea. The serious version — a bespoke or project-specific build,
with a team on it — is a real decision with a real cost, and a conversation rather than a
download.

---

## Safety

1. **The AI edits your files.** Use a fresh folder and a copy. Never point an assistant at
   something you have not backed up.
2. **This page sends nothing anywhere.** It makes no network calls at all after it loads —
   open your browser's developer tools and watch the network tab. Your project files never
   leave your computer.
3. **Nothing marks itself done and nothing commits on your behalf.** A person accepts work.

---

## Licence and feedback

MIT — see [LICENSE](LICENSE). Use it, change it, build on it.

Found something broken, or have a thought? Open an issue on this repository.

Built by [AgilityAI](https://agilityai.com.au).

---

<sub>Relay v0.1.0 · generated 2026-09-01 · built from the development repo, do not edit here</sub>
