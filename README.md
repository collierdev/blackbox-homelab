# Blackbox Homelab 

> **Video Walkthrough:** https://www.youtube.com/watch?v=jWm0GwgtvWo
> **Live Repo:** [github.com/collierdev/blackbox-homelab](https://github.com/collierdev/blackbox-homelab)

---

## Problem Statement

Knowledge workers juggling multiple domains face a fragmented tool landscape — notes in one app, tasks in another, calendars in a third, home automation in a fourth. The "solutions" are expensive SaaS subscriptions ($15–50/month each) that lock your data in proprietary silos and require constant cloud connectivity.

As a developer working across clinical data, bioinformatics, and full-stack development, I experience this daily: ~20 minutes of context-gathering across 4–5 tools before productive work begins. I also need an AI assistant that understands my personal knowledge base — but routing everything through cloud APIs burns tokens on simple retrieval tasks that should run locally for pennies.

**Who's affected:** Developers, knowledge workers, and homelab builders who want AI-augmented personal infrastructure without enterprise pricing or vendor lock-in.

**What success looks like:** A single self-hosted platform on commodity hardware (<$200 total BOM) that consolidates daily planning, smart home control, file management, media, cameras, and AI-assisted editing — reducing morning context-gathering to a glance at a wall-mounted display. Target outcomes: fewer context switches per day, 60–80% reduction in AI API spend via local model offloading, and zero recurring SaaS costs for core productivity tools.

---

## Solution Overview

Blackbox Homelab is a self-hosted platform running on a Raspberry Pi 5 that replaces a half-dozen SaaS tools with a single Docker Compose stack. At its core is a custom **React 18 + Express 5** dashboard with seven integrated views:

**System Dashboard** — Real-time CPU, memory, disk, temperature, and Docker container status at a glance. Network interfaces, smart-home rollups (lights, switches, climate, media), and live security camera feeds.

**Smart Home** — Direct control of Home Assistant entities: per-room light toggles with brightness/color, media players, and a surveillance grid streaming go2rtc camera feeds.

**Calendar & Tasks** — Unified calendar with month/week/day layouts, Google/Microsoft/iCloud/CalDAV sync, and integrated task management backed by Neo4j.

**AI Chat** — Streaming chat console wired to Ollama (local models like `llama3.2`) with Claude API fallback. Context attachments, voice input, and contextual command suggestions.

**Planner** — Daily focus board: today's schedule from synced calendars, current focus block, daily routines, "Up Next" reminders, and an environment readout. Drag-and-drop prioritization via @dnd-kit.

**Vault** — Markdown/code editor with tree explorer, bookmarked filesystem roots, and a side-panel AI assistant for context-aware editing. Backed by CouchDB for Obsidian LiveSync compatibility.

**Settings** — System config, service connections (Home Assistant, go2rtc, Ollama URLs/tokens), AI model preferences, calendar OAuth setup, and notification preferences.

**AI's role is core, not supplementary.** Without AI, this is a static dashboard and a text editor. AI transforms it into a system that understands your knowledge base, prioritizes your day, and provides agentic editing — all from hardware costing less than two months of typical SaaS subscriptions.

---

## AI Integration

### Models & APIs

**Claude 3.5 Sonnet (Anthropic API)** — Primary model for complex agentic tasks: multi-file edits, code generation, reasoning over large context. Used when task complexity justifies token cost. Accessed via the Express backend at `/api/chat/claude`.

**Ollama (local — llama3.2, Deepseek-R1 7B, Gemma 2 2B)** — Lightweight local models for RAG retrieval, Q&A over the personal knowledge base, and file summarization. Runs on-device (ARM64) to minimize API spend. The AI Chat panel defaults to Ollama with automatic Claude fallback.

**Gemini 1.5 Flash (Google API)** — Planned mid-tier option for moderate-complexity tasks. Not yet integrated.

### Agentic Patterns

**Tiered model routing** — Simple retrieval queries ("what did I write about X?") route to Ollama locally; complex synthesis queries route to Claude. This is the key cost optimization — ~70% of queries stay local.

**Tool use** — File system operations (read, write, create, rename, search) exposed as tools to the LLM via function calling, enabling agentic file management from the Vault editor. The model chains tools autonomously — e.g., "refactor this file and update imports" triggers read → identify changes → write → search dependents → update.

**Context-aware planning** — The Planner uses chain-of-thought to prioritize tasks based on deadlines, routine patterns, and knowledge base context, incorporating today's calendar, overdue items, and recently edited files.

### Tradeoffs & Honest Assessment

**Local-first with cloud fallback** — Lower cost but higher latency for complex tasks. Ollama on the Pi 5 is painfully slow beyond simple retrieval: 7B models take 8–15 seconds per query vs. sub-second via API. This forces more traffic to Claude than planned and is the project's biggest ongoing cost challenge.

**RAG over full-context** — Cheaper but risks missing cross-document connections.

**What exceeded expectations:** Claude's tool-use capabilities made the agentic Vault editor far simpler than expected. Defining file operations as tools and letting the model orchestrate multi-step edits worked remarkably well — less glue code than anticipated.

**What fell short:** Local inference speed. 7B models produce acceptable RAG results but struggle with multi-step reasoning. This is the primary motivation for tracking smaller, more capable models (Phi-4, Gemma 3) as they release.

---

## Architecture

```
┌───────────────────────────────────────────────────┐
│                  Client Browser                    │
│  7 Views: System │ Smart Home │ Calendar │ AI Chat │
│           Planner │ Vault │ Settings               │
│  (React 19 + Vite 7 + TailwindCSS 4)              │
└──────────────────────┬────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────┐
│         nginx reverse proxy + dnsmasq              │
│    (*.blackbox wildcard DNS → 192.168.50.39)       │
└──────────────────────┬────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌───────────┐  ┌──────────┐  ┌──────────────┐
  │ Express 5 │  │  Ollama   │  │Home Assistant │
  │ + Socket  │  │ (local   │  │  + Mosquitto  │
  │   .IO     │  │  LLMs)   │  │  + govee2mqtt │
  │ (TS/Node) │  └──────────┘  └──────────────┘
  └─────┬─────┘
        │
   ┌────┼─────────┬──────────┐
   ▼    ▼         ▼          ▼
Claude  Neo4j    CouchDB    go2rtc
 API   (graph   (Obsidian   (camera
       DB)      LiveSync)   streams)
```

### Key Decisions

**Raspberry Pi 5 (8GB)** — $80 board with enough RAM for 7B quantized models via Ollama plus the full Docker stack. Total BOM under $200 including case, SD card, power supply.

**Docker Compose for everything** — Every service containerized and reproducible. The stack includes: nginx, Express+React dashboard, Neo4j, CouchDB, Home Assistant, Mosquitto, govee2mqtt, go2rtc, n8n, Jellyfin, Portainer.

**Express 5 + TypeScript backend** — Chosen for ecosystem alignment: the entire stack is JavaScript/TypeScript. Socket.IO provides real-time system stats streaming. Neo4j driver, googleapis, and @microsoft/microsoft-graph-client handle data and calendar sync.

**React 18 + Vite 7 frontend** — @tanstack/react-query for server state, d3 for charting, @dnd-kit for drag-and-drop planner, react-markdown for AI chat and vault rendering.

**Neo4j for structured data** — Tasks, planner relationships, and encrypted OAuth tokens stored in a graph DB. CouchDB handles the markdown vault (Obsidian LiveSync compatible).

**nginx + dnsmasq** — Single entry point with wildcard DNS so every service gets a friendly `*.blackbox` URL on the LAN.

**Local-first data** — All data stays on the Pi. Markdown files are the source of truth for notes. Neo4j stores structured relationships. No cloud sync dependency.

### Notable Tradeoffs

**Single Pi = single point of failure** — Accepted for personal use; ZFS auto-snapshots and daily backups mitigate data loss risk.

**Socket.IO for real-time stats** — Adds nginx config complexity (WebSocket upgrade headers) but enables live system monitoring without polling.

**Full service stack on one board** — Ambitious for a Pi 5, but containerization lets you disable what you don't need. Memory headroom is tight when Ollama is running alongside everything else.

---

## What Did AI Help You Do Faster (and Where Did It Get in the Way)?

### Tools Used

**Claude Code & Cowork** — Primary development tool. Scaffolded the Express backend, wrote Docker configurations, debugged nginx routing, and iterated on all seven React views. Claude Code's ability to read full project context and make coordinated multi-file changes was the biggest accelerator.

**Cursor** — Rapid iteration on React components, especially the Vault editor. Inline completions were faster for small, focused edits.

**ChatGPT (GPT-4o)** — Brainstorming architecture approaches, generating visual assets for the demo video, rubber-ducking design decisions.

**Google Stitch and Claude Design** — Rapid prototyping of front-end designs and UI mockups for all seven dashboard views.

### Where AI Accelerated

Boilerplate elimination, compatibility bug fixes, and workflow automation were the biggest wins — Docker Compose configs, Express route scaffolding, React component structure all generated in minutes instead of hours. Claude Code diagnosed an nginx WebSocket upgrade misconfiguration that would have taken significant time to debug manually. I also used Claude to rapidly prototype three different approaches to tiered model routing before committing to one.

### Where AI Got in the Way

**ARM64 blind spots** — AI models consistently suggested x86-only libraries or approaches assuming abundant RAM. Every dependency needed manual ARM64 compatibility verification.

**Ollama on ARM** — Claude's knowledge of Ollama configuration on ARM was sometimes outdated. Ended up referencing GitHub issues directly for correct model pull syntax and memory tuning.

**Over-engineering tendency** — AI suggestions sometimes introduced unnecessary abstraction (e.g., a full plugin system for model routing when a simple conditional was sufficient). Had to consciously keep the architecture simple for a resource-constrained device.

---

## Getting Started

### Prerequisites

- Raspberry Pi 5 (8GB recommended) with Debian 13 or Raspberry Pi OS 64-bit
- Docker Engine + Compose v2
- Node.js 24.x + npm 11.x
- 64GB+ microSD or NVMe (128GB recommended for model storage)
- Static IP on the LAN (guide uses `192.168.50.39`)

### Quick Start

```bash
git clone https://github.com/collierdev/blackbox-homelab.git
cd blackbox-homelab/Dashboard

cp .env.example .env
# Edit .env — at minimum:
#   NEO4J_PASSWORD=<strong password>
#   ENCRYPTION_SECRET=$(openssl rand -base64 32)
#   HA_URL=http://192.168.50.39:8123
#   HA_TOKEN=<Home Assistant Long-Lived Access Token>

docker compose up -d --build

# Pull a local model (first run only)
ollama pull llama3.2

# Access the dashboard
open http://192.168.50.39:8080
```

For the full per-service setup (Home Assistant, Mosquitto, go2rtc, Jellyfin, n8n, nginx, dnsmasq, ZFS, etc.), see the [platform README](https://github.com/collierdev/blackbox-homelab/blob/master/README.md).

---

## Demo

https://www.youtube.com/watch?v=jWm0GwgtvWo
Screenshots can be found in the GitHub repo under Dashboard/docs/Screenshots

---

## Testing & Error Handling

The system is designed for graceful degradation — no single failure bricks the dashboard.

### E2E Testing (Playwright)

End-to-end tests live in `~/Dashboard/e2e-tests` and run against the full stack using **@playwright/test 1.57**. Tests verify critical user flows across all seven views: dashboard loads and renders live system stats, Smart Home toggles propagate to Home Assistant, calendar sync round-trips through OAuth, AI Chat sends a prompt and streams a response from Ollama, Planner drag-and-drop reorders persist to Neo4j, and the Vault editor opens/saves files correctly. Tests run in headless Chromium on the Pi itself or from a workstation pointed at the dashboard URL.

### Linting & Type Safety

**ESLint 9** with **typescript-eslint 8** and **eslint-plugin-react-hooks** enforces consistent code quality across both client and server. **TypeScript 5.9** in strict mode catches type errors at compile time — every API route handler, Socket.IO event, and React component is fully typed. The dev loop uses **nodemon** + **ts-node** for hot-reload on the server and **Vite 7** HMR on the client, with **concurrently** orchestrating both processes via `npm run dev`.

### Form & Schema Validation

All user-facing forms use **react-hook-form 7** with **Zod 3** schemas (via **@hookform/resolvers**) for client-side validation. Server-side API endpoints mirror those Zod schemas to validate request bodies, sanitize file paths, model names, and prompt content, and enforce maximum prompt lengths.

### Runtime Error Handling

**API fallback chain** — When Claude is unreachable (network outage, rate limit, invalid key), the backend falls back to Ollama-only mode. A banner indicates "Cloud AI unavailable — running local models only." Complex tasks queue with exponential backoff (2s initial, 60s max, 5 retries).

**Container recovery** — All Docker services run with `restart: unless-stopped`. A health check endpoint pings Ollama every 30 seconds; if unresponsive, Docker restarts the container and the backend temporarily routes all queries to Claude.

**File system safety** — Path traversal prevention (all paths sanitized against vault root), atomic file writes (temp + rename to prevent corruption), and extension-based filtering (editor only opens text files). **chokidar** watches the vault directory for external changes and pushes updates to the client via Socket.IO in real time.

**Real-time resilience** — The System Dashboard and Planner cache their last-rendered state in the browser. If the backend becomes unreachable, the display continues showing recent data with a "Last updated" indicator rather than going blank.

**Token-aware rate limiting** — Anthropic API calls are wrapped with a rate limiter that tracks tokens-per-minute usage and preemptively delays requests approaching the limit. Usage stats are exposed at `/api/stats` for monitoring.

---

## Future Improvements

- **Bug Fixes** — Continue to fix bugs including adding more fallbacks and testing features.
- **Smoother Integrations** — Make the process of adding new smart home items and integrations more streamlines.
- **Better local AI** — As smaller, more capable models ship (Phi-4, Gemma 3), re-evaluate what runs locally. Goal: 80%+ of queries on-device.
- **MCP server ecosystem** — Expose dashboard capabilities as MCP tools so external AI agents (Claude Desktop, etc.) can query the personal knowledge base.
- **Voice interface** — Wake-word detection + speech-to-text for hands-free interaction with the wall-mounted planner display.
- **Cheaper hardware** — Explore Orange Pi, older Pi models, or repurposed thin clients to push BOM under $100.
- **Gemini integration** — Add Gemini 1.5 Flash as a mid-tier routing option between local models and Claude.
- **Multi-Pi cluster** — Document a 2-Pi setup with automatic failover for users who want redundancy.

---

## Acknowledgments

### Platform & Infrastructure
[Docker](https://www.docker.com) (containerization) · [nginx](https://nginx.org) (reverse proxy) · [dnsmasq](https://thekelleys.org.uk/dnsmasq/doc.html) (local DNS) · [ZFS on Linux](https://openzfs.org) (filesystem + snapshots) · [Samba](https://www.samba.org) (SMB file sharing) · [Tailscale](https://tailscale.com) (mesh VPN) · [Portainer](https://www.portainer.io) (Docker UI)

### Smart Home & Media
[Home Assistant](https://www.home-assistant.io) (smart home hub) · [Mosquitto](https://mosquitto.org) (MQTT broker) · [govee2mqtt](https://github.com/wez/govee2mqtt) (Govee device bridge) · [go2rtc](https://github.com/AlexxIT/go2rtc) (camera streaming) · [Jellyfin](https://jellyfin.org) (media server) · [n8n](https://n8n.io) (workflow automation)

### AI & LLM
[Anthropic](https://anthropic.com) (Claude API + Claude Code + Claude Cowork + Claude Design) · [Ollama](https://ollama.com) (local LLM serving on ARM64) · [ChatGPT](https://chatgpt.com)(architecture design)· [Google](https://stitch.withgoogle.com/)(Google Stitch + Nonbanana)

### Databases
[Neo4j](https://neo4j.com) (graph database — tasks, planner, OAuth tokens) · [CouchDB](https://couchdb.apache.org) (Obsidian LiveSync vault backend)

### Server Stack (Express / Node)
[Express 5](https://expressjs.com) · [Socket.IO 4](https://socket.io) (real-time stats) · [dockerode 4](https://github.com/apocas/dockerode) (Docker API client) · [systeminformation 5](https://systeminformation.io) (hardware metrics) · [neo4j-driver 5](https://neo4j.com/docs/javascript-manual/) · [googleapis 130](https://github.com/googleapis/google-api-nodejs-client) + [@microsoft/microsoft-graph-client 3](https://github.com/microsoftgraph/msgraph-sdk-javascript) (calendar sync) · [tsdav 2](https://github.com/nicholasgasior/tsdav) (CalDAV) · [node-ical 0.26](https://github.com/jens-maus/node-ical) + [rrule 2](https://github.com/jakubroztocil/rrule) (.ics parsing & recurrence) · [adm-zip](https://github.com/cthackers/adm-zip) (Google Takeout import) · [chokidar](https://github.com/paulmillr/chokidar) (file watching) · [cron 3](https://github.com/kelektiv/node-cron) · [date-fns 3](https://date-fns.org) · [uuid 9](https://github.com/uuidjs/uuid) · [cors 2](https://github.com/expressjs/cors)

### Client Stack (React)
[React 19](https://react.dev) + [React DOM 19](https://react.dev) · [Vite 7](https://vite.dev) · [TailwindCSS 4](https://tailwindcss.com) · [@tanstack/react-query 5](https://tanstack.com/query) (server state) · [socket.io-client 4](https://socket.io) · [react-hook-form 7](https://react-hook-form.com) + [Zod 3](https://zod.dev) (forms & validation) · [@dnd-kit](https://dndkit.com) (drag-and-drop planner) · [d3 7](https://d3js.org) (charting) · [lucide-react](https://lucide.dev) (icons) · [react-markdown 10](https://github.com/remarkjs/react-markdown) (markdown rendering)

### Dev & Test Tooling
[TypeScript 5.9](https://www.typescriptlang.org) · [@playwright/test 1.57](https://playwright.dev) (E2E testing) · [ESLint 9](https://eslint.org) + [typescript-eslint 8](https://typescript-eslint.io) (linting) · [concurrently 9](https://github.com/open-cli-tools/concurrently) (dev orchestration) · [nodemon](https://nodemon.io) + [ts-node](https://typestrong.org/ts-node/) (server dev loop)
