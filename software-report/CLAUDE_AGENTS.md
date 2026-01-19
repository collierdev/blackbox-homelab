# Claude Code Custom Agents & Configuration

This document describes the custom subagents, MCP servers, and permission settings configured for Claude Code on this system.

---

## Quick Reference

| Agent | Purpose | Command Example |
|-------|---------|-----------------|
| `frontend` | UI/React/CSS/Playwright | `Use the frontend agent to create a navbar` |
| `backend` | APIs/databases/server | `Use the backend agent to design a REST API` |
| `syseng` | Infrastructure/Docker/networking | `Use the syseng agent to check container health` |
| `pm` | PRDs/specs/project planning | `Use the pm agent to write a PRD` |

---

## Custom Agents

Location: `~/.claude/agents/`

All agents are configured with:
- **Model**: Sonnet (balanced cost/performance)
- **Permission Mode**: `bypassPermissions` (full automation, no prompts)
- **Tools**: Read, Edit, Write, Grep, Glob, Bash

### Frontend Agent (`frontend.md`)

**Expertise:**
- React, Vue, Svelte, vanilla JS/TS
- CSS, Tailwind, styled-components
- HTML semantics and accessibility (WCAG)
- Build tools (Vite, Webpack, esbuild)
- Testing (Jest, Vitest, Playwright, Cypress)
- Performance optimization (Core Web Vitals)

**Special Role:** Primary owner of Playwright E2E testing when multiple agents collaborate.

**Playwright Commands:**
```bash
npx playwright test                    # Run all tests
npx playwright test <file>             # Run specific test
npx playwright test --ui               # Interactive UI mode
npx playwright show-report             # View test report
npx playwright codegen <url>           # Generate tests
```

---

### Backend Agent (`backend.md`)

**Expertise:**
- Node.js, Python, Go, shell scripting
- REST API design and GraphQL
- SQL (PostgreSQL, MySQL, SQLite) and NoSQL (MongoDB, Redis)
- Authentication (JWT, OAuth, sessions)
- Message queues and background jobs
- Docker and containerization
- Caching strategies and API security

**Note:** Defers Playwright UI testing to frontend agent when collaborating.

---

### System Engineering Agent (`syseng.md`)

**Expertise:**
- Docker and container orchestration
- Linux system administration (Debian/Ubuntu)
- ZFS storage management
- Samba/SMB file sharing
- systemd services
- Security hardening

**Networking:**
- TCP/IP, DNS, DHCP configuration
- Firewall management (iptables, ufw, nftables)
- Port forwarding and NAT
- VPN/tunneling (Tailscale, WireGuard, OpenVPN)
- Reverse proxies (nginx, Traefik, Caddy)
- SSL/TLS certificates
- Network diagnostics (ping, traceroute, ss, tcpdump, nmap)

**Platform Context:** Pre-configured with this Pi's IP (192.168.50.39), services, and infrastructure details.

**Common Commands:**
```bash
# Docker
sudo docker ps
sudo docker logs <container>
sudo docker restart <container>

# Services
sudo systemctl status/restart <service>
journalctl -u <service> -n 50

# ZFS
zpool status blackbox
zfs list

# Networking
ip addr
ss -tulpn
sudo ufw status
tailscale status
```

---

### Project Management Agent (`pm.md`)

**Expertise:**
- Product Requirements Documents (PRDs)
- Technical specifications
- User stories and acceptance criteria
- Sprint planning and backlog grooming
- Roadmaps and prioritization
- Risk assessment

**Includes Templates For:**
- Full PRD structure
- User story format (As a... I want... So that...)
- Task breakdown with dependencies
- Definition of Done checklists

---

## MCP Servers

Location: `~/.claude/settings.json`

### Memory Keeper

Installed globally via npm: `/usr/bin/mcp-memory-keeper`

**Purpose:** Persists context across Claude Code sessions, reducing need to re-explain project state.

**Configuration:**
```json
{
  "mcpServers": {
    "memory-keeper": {
      "command": "/usr/bin/mcp-memory-keeper",
      "args": []
    }
  }
}
```

---

## Pre-Approved Bash Commands

Location: `~/.claude/settings.json`

The following command categories are pre-approved and run without permission prompts:

| Category | Commands |
|----------|----------|
| **Dev Tools** | npm, npx, node, git, python3, pip3, pytest, cargo, go, make, cmake, gcc, g++ |
| **Docker** | docker, sudo docker, docker-compose |
| **System** | systemctl, journalctl, ps, top, htop, kill, pkill |
| **Storage** | zpool, zfs, sudo zpool, sudo zfs, df, du |
| **Network** | ip, ss, ping, curl, wget, nslookup, dig, traceroute, netstat, lsof, tailscale |
| **Files** | ls, tree, cat, head, tail, wc, sort, uniq, diff, mkdir, cp, mv, rm, chmod, chown, ln, tar, gzip, zip |
| **Services** | ollama, gh, smbclient, testparm |
| **Utilities** | which, whereis, env, export, source, pwd, date, uptime, free |

---

## Permission Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `default` | Standard permission checking | Maximum safety |
| `acceptEdits` | Auto-accept file edits | Balanced automation |
| `dontAsk` | Auto-deny unpermitted ops | Read-only exploration |
| `bypassPermissions` | **Current** - No checks | Full automation |
| `plan` | Read-only mode | Planning/research |

To change an agent's permission mode, edit its `.md` file in `~/.claude/agents/` and modify the `permissionMode` field.

---

## File Locations

| File | Purpose |
|------|---------|
| `~/.claude/agents/frontend.md` | Frontend agent config |
| `~/.claude/agents/backend.md` | Backend agent config |
| `~/.claude/agents/syseng.md` | System engineering agent config |
| `~/.claude/agents/pm.md` | Project management agent config |
| `~/.claude/settings.json` | MCP servers and pre-approved commands |
| `~/.claude/settings.local.json` | Session-specific permissions (auto-generated) |
| `~/CLAUDE.md` | Project context for Claude Code |

---

## Usage Examples

### Single Agent
```
Use the frontend agent to create a responsive card component

Use the syseng agent to diagnose why Jellyfin container keeps restarting

Use the pm agent to create user stories for the dashboard redesign
```

### Multiple Agents Collaborating
```
Use the frontend, backend, and pm agents to implement and document the login feature
```

When multiple agents collaborate:
- `frontend` handles all Playwright/E2E testing
- Other agents defer UI testing to frontend
- Each agent focuses on its domain

### Managing Agents
```
/agents          # View, create, edit, delete agents
/context         # See token usage breakdown
/cost            # Check session costs
```

---

## Token Optimization

These configurations reduce token usage by:

1. **bypassPermissions** - No permission prompts = no approval tokens
2. **Pre-approved commands** - Common commands run instantly
3. **Isolated context** - Each agent has separate context; verbose output stays contained
4. **Memory Keeper MCP** - Persists context across sessions

---

## Reverting Changes

### Disable Full Automation
Edit each agent file and change:
```yaml
permissionMode: bypassPermissions
```
to:
```yaml
permissionMode: acceptEdits  # or "default" for full prompts
```

### Remove Pre-Approved Commands
Edit `~/.claude/settings.json` and remove the `permissions` block.

### Disable Memory Keeper
Edit `~/.claude/settings.json` and remove the `mcpServers` block, or run:
```bash
sudo npm uninstall -g mcp-memory-keeper
```

---

## Changelog

- **2026-01-15**: Initial setup
  - Created 4 custom agents (frontend, backend, syseng, pm)
  - Installed mcp-memory-keeper MCP
  - Added 70+ pre-approved bash commands
  - Set all agents to bypassPermissions mode
  - Added Playwright ownership to frontend agent
  - Added networking capabilities to syseng agent
