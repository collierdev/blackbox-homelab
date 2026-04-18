# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Platform Overview

This is a Raspberry Pi 5 development platform (ARM64/aarch64) running Debian GNU/Linux 13 (trixie). The system serves as a self-hosted server environment with Docker-based services and development tools.

**IP Address**: 192.168.50.39

## TODO.md

The `~/TODO.md` file tracks pending setup tasks (account creation, authentication, etc.). Update this file as tasks are completed.

## software-report Directory

The `~/software-report/` directory contains documentation created by Claude during initial system setup. These files track all software installations and should be updated when making system changes:

- **INSTALLATION_REPORT.md** - Current installed software, access URLs, service commands, and configuration status
- **SOFTWARE_SUGGESTIONS.md** - Curated list of recommended software with Docker run commands
- **CHANGELOG.md** - Installation history with versions, commands used, and removal instructions
- **CLAUDE_AGENTS.md** - Custom Claude Code subagents and configuration

When installing or removing software, update these files to maintain accurate system documentation.

## Claude Code Custom Agents

Custom subagents for specialized tasks. See `~/software-report/CLAUDE_AGENTS.md` for full documentation.

| Agent | Purpose | Example |
|-------|---------|---------|
| `frontend` | UI/React/CSS/Playwright | `Use the frontend agent to...` |
| `backend` | APIs/databases/server | `Use the backend agent to...` |
| `syseng` | Infrastructure/Docker/networking | `Use the syseng agent to...` |
| `pm` | PRDs/specs/planning | `Use the pm agent to...` |

**Configuration**: `~/.claude/agents/` (agents), `~/.claude/settings.json` (MCP + permissions)

## Installed Services

**Access**: All services are available through nginx reverse proxy with friendly URLs powered by local DNS (dnsmasq).

| Service | Type | Proxy URL | Direct URL |
|---------|------|-----------|------------|
| Docker | System | - | CLI: `docker` |
| **Pi Dashboard** | Docker | http://blackbox/ | http://192.168.50.39:8080 |
| **Jellyfin** | Docker | http://jellyfin.blackbox | http://192.168.50.39:8096 |
| **n8n** | Docker | http://n8n.blackbox | http://192.168.50.39:5678 |
| Portainer | Docker | http://blackbox/portainer | https://192.168.50.39:9443 |
| Plex | System | http://plex.blackbox | http://192.168.50.39:32400/web |
| **Home Assistant** | Docker | http://ha.blackbox | http://192.168.50.39:8123 |
| **go2rtc** | Docker | http://go2rtc.blackbox | http://192.168.50.39:1984 |
| Ollama | System | - | http://localhost:11434 |
| Tailscale | System | - | CLI: `tailscale` |
| GitHub CLI | System | - | CLI: `gh` |
| **nginx** | System | - | Port 80 (reverse proxy) |
| **dnsmasq** | System | - | Port 53 (DNS server) |
| **Samba** | System | `\\blackbox` | `\\192.168.50.39` |
| **ZFS** | System | - | Pool: `blackbox` at `/blackbox` |
| **CouchDB** | Docker | https://vault.blackbox | http://192.168.50.39:5984 |
| **Obsidian** | AppImage | - | `~/obsidian/Obsidian-1.12.7-arm64.AppImage` |

### nginx Reverse Proxy + Local DNS

**Status**: ✅ Fully configured and operational

The system uses **nginx** as a reverse proxy with **dnsmasq** for local DNS resolution, providing friendly URLs for all services.

**Routing Strategy**:
- **Path-based**: Pi Dashboard (root), Portainer → `http://blackbox/service`
- **Subdomain**: Jellyfin, n8n, Plex, Home Assistant, go2rtc → `http://service.blackbox`
- **Subdomain (HTTPS)**: CouchDB/LiveSync → `https://vault.blackbox`

**How it works**:
1. **dnsmasq** (port 53) resolves `*.blackbox` to `192.168.50.39`
2. **nginx** (port 80/443) routes requests to backend services
3. All services remain accessible on original ports as fallback

**Configuration files**:
- `/etc/dnsmasq.conf` - DNS server configuration
- `/etc/nginx/nginx.conf` - Main nginx config
- `/etc/nginx/sites-available/*` - Service routing configs

**To use on all network devices**: Configure your router to use `192.168.50.39` as primary DNS server.

### Pi Dashboard

Custom dashboard for system monitoring and service management. Source code in `~/Dashboard/`. See `~/Dashboard/CLAUDE.md` for detailed documentation.

**Access**: http://blackbox/ (or http://192.168.50.39:8080)

**Features**: Real-time CPU/memory/disk/temp stats, service start/stop/restart, network services table with IPs/ports, memory usage by process (sortable), AI chat integration (Ollama/Claude), Home Assistant smart home control (lights, switches, climate, media players, cameras)

**Docker run command** (requires `--pid=host --privileged` for host system access):
```bash
sudo docker run -d --name pi-dashboard --restart=always \
  -p 8080:8080 --pid=host --privileged \
  -v /var/run/docker.sock:/var/run/docker.sock:ro pi-dashboard
```

**Note**: Runs on port 8080 (proxied through nginx on port 80)

## Common Commands

```bash
# Docker container management
sudo docker ps                      # List running containers
sudo docker logs <container>        # View container logs
sudo docker restart <container>     # Restart container

# System services
sudo systemctl status <service>     # Check service status
sudo systemctl restart <service>    # Restart service
sudo journalctl -u <service> -n 50  # View service logs

# nginx (reverse proxy)
sudo systemctl status nginx         # Check nginx status
sudo systemctl restart nginx        # Restart nginx
sudo nginx -t                       # Test configuration
sudo tail -f /var/log/nginx/error.log  # View error logs

# dnsmasq (local DNS)
sudo systemctl status dnsmasq       # Check DNS server status
sudo systemctl restart dnsmasq      # Restart DNS server
nslookup blackbox 127.0.0.1         # Test DNS resolution
sudo journalctl -u dnsmasq -n 20    # View DNS logs

# Ollama (local LLM)
ollama list                         # List downloaded models
ollama pull <model>                 # Download a model
ollama run <model>                  # Run interactive chat

# GitHub CLI
gh auth login                       # Authenticate with GitHub
gh repo clone <owner/repo>          # Clone a repository
gh pr create                        # Create a pull request
gh issue list                       # List issues

# ZFS storage
zpool status blackbox               # Check pool health
zfs list                            # Show datasets and usage
zfs list -t snapshot                # List snapshots
zpool scrub blackbox                # Manual integrity check

# Samba file sharing
sudo systemctl status smbd          # Check Samba status
sudo smbpasswd -a <user>            # Add/change Samba user
testparm                            # Validate smb.conf
```

## Key Data Locations

| Data | Location |
|------|----------|
| Jellyfin config | Docker volume: `jellyfin_config` |
| n8n workflows | Docker volume: `n8n_data` |
| Portainer config | Docker volume: `portainer_data` |
| Home Assistant config | Docker volume: `homeassistant_config` |
| go2rtc config | `~/go2rtc/go2rtc.yaml` |
| Plex library | `/var/lib/plexmediaserver/` |
| Ollama models | `/usr/share/ollama/.ollama/models/` |
| ZFS Pool (blackbox) | `/blackbox/*` |
| Samba config | `/etc/samba/smb.conf` |
| CouchDB data | Docker volume: `couchdb_data` |
| CouchDB config | Docker volume: `couchdb_config` |
| Obsidian AppImage | `~/obsidian/` |
| SSL certificates | `/etc/nginx/ssl/` |

## ZFS Storage (Pool: blackbox)

**Disk**: 899GB external drive at `/blackbox`

| Dataset | Path | Purpose | Special |
|---------|------|---------|---------|
| `blackbox/media` | `/blackbox/media` | General media files | 1M recordsize |
| `blackbox/jellyfin` | `/blackbox/jellyfin` | Jellyfin media library | 1M recordsize |
| `blackbox/plex` | `/blackbox/plex` | Plex media library | 1M recordsize |
| `blackbox/backups` | `/blackbox/backups` | Backup storage | ZSTD compression |
| `blackbox/documents` | `/blackbox/documents` | Documents | - |
| `blackbox/shared` | `/blackbox/shared` | Shared files | - |
| `blackbox/docker` | `/blackbox/docker` | Docker volumes | No snapshots |
| `blackbox/scratch` | `/blackbox/scratch` | Temporary workspace | No snapshots |

**Features**: LZ4 compression, 1GB ARC limit, auto-snapshots (7 daily, 4 weekly, 3 monthly), monthly scrub

## Samba File Sharing (Windows Access)

**Access**: `\\192.168.50.39` or `\\blackbox`
**Credentials**: `jwcollie` / `jkloo123`

All ZFS datasets are shared via Samba. To map network drives in Windows (run as Admin):
```cmd
net use M: \\192.168.50.39\Media /user:jwcollie jkloo123 /persistent:yes
net use B: \\192.168.50.39\Backups /user:jwcollie jkloo123 /persistent:yes
```

## Development Environment

- **Node.js**: 24.12.0 (npm 11.6.2)
- **Python**: 3.x with pip3
- **Editors**: VS Code (`code`), Neovim (`nvim`)
- **Terminal**: tmux for session persistence
- **Build tools**: gcc, g++, make

## Notes for Future Updates

- User `jwcollie` is in the docker group (no sudo needed for docker commands after re-login)
- All Docker containers use `--restart=always` for auto-start on boot
- fail2ban protects SSH automatically
- Tailscale provides secure remote access when authenticated
- Running in CPU-only mode for Ollama (no GPU)
- ZFS pool `blackbox` is a single disk - can add mirror later with `zpool attach blackbox sda <new-drive>`
- ZFS auto-snapshots run automatically (daily/weekly/monthly)
- ZFS scrub runs monthly on the 1st at 2am via `/etc/cron.d/zfs-scrub`
- Pi Dashboard requires `--pid=host --privileged` flags to access host system metrics
