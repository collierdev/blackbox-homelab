# Installation Report

**Last Updated**: January 19, 2026

> **Note**: This file is maintained by Claude Code. When installing or modifying software, update this report to keep system documentation accurate.

## System Information
- **Device**: Raspberry Pi 5 (ARM64/aarch64)
- **OS**: Debian GNU/Linux 13 (trixie)
- **IP Address**: 192.168.50.39

---

## Installation Summary

### Successfully Installed

| Software | Version | Status | Access URL | Installed |
|----------|---------|--------|------------|-----------|
| Docker | 29.1.4 | Running | CLI: `docker` | Jan 11, 2026 |
| Jellyfin | Latest | Running | http://192.168.50.39:8096 | Jan 12, 2026 |
| n8n | Latest | Running | http://192.168.50.39:5678 | Jan 11, 2026 |
| Plex Media Server | 1.42.2.10156 | Running | http://192.168.50.39:32400/web | Jan 11, 2026 |
| VS Code | 1.108.0 | Installed | Launch: `code` | Jan 11, 2026 |
| Ollama | 0.13.5 | Running | API: http://localhost:11434 | Jan 11, 2026 |
| Portainer | Latest (CE) | Running | https://192.168.50.39:9443 | Jan 12, 2026 |
| Tailscale | 1.92.5 | Running | CLI: `tailscale` | Jan 12, 2026 |
| tmux | 3.5a | Installed | CLI: `tmux` | Jan 12, 2026 |
| fail2ban | 1.1.0 | Running | Auto-protecting SSH | Jan 12, 2026 |
| neovim | 0.10.4 | Installed | CLI: `nvim` | Jan 12, 2026 |
| Node.js | 24.12.0 | Installed | CLI: `node`, `npm` | Jan 12, 2026 |
| Samba | 4.22.6 | Running | `\\192.168.50.39` | Jan 13, 2026 |
| ZFS | 2.3.1 | Running | Pool: `blackbox` (899GB) | Jan 13, 2026 |
| zfs-auto-snapshot | 1.2.4 | Running | Auto snapshots enabled | Jan 13, 2026 |
| GitHub CLI | 2.83.2 | Installed | CLI: `gh` | Jan 13, 2026 |
| **Home Assistant** | Latest | Running | http://192.168.50.39:8123 | Jan 13, 2026 |
| **go2rtc** | 1.9.13 | Running | http://192.168.50.39:1984 | Jan 14, 2026 |
| **Pi Dashboard** | Custom | Running | http://192.168.50.39 | Jan 12, 2026 |

---

## Initial Setup - Completed

All services have been configured and are ready to use. This section is kept for reference.

### ~~1. n8n (Workflow Automation)~~ ✓ COMPLETED
- **URL**: http://192.168.50.39:5678
- **Status**: Owner account created (Jan 12, 2026)

### ~~2. Plex Media Server~~ ✓ COMPLETED
- **URL**: http://192.168.50.39:32400/web
- **Status**: Server claimed and configured (Jan 12, 2026)

### ~~3. Ollama~~ ✓ COMPLETED
- **Status**: Running with llama3.2 model (2.0 GB) downloaded
- **Available models**: Run `ollama list` to see downloaded models
- **Note**: Running in CPU-only mode (no NVIDIA/AMD GPU detected)

### 4. VS Code
- **Launch**: Run `code` from terminal or find in applications menu
- **Note**: GUI application - requires display or remote access

### ~~5. Portainer (Docker Management GUI)~~ ✓ COMPLETED
- **URL**: https://192.168.50.39:9443
- **Status**: Admin account created (Jan 12, 2026)

### ~~6. Tailscale (Secure Remote Access)~~ ✓ COMPLETED
- **Status**: Authenticated (Jan 12, 2026)

### ~~7. GitHub CLI (Repository Management)~~ ✓ COMPLETED
- **Status**: Authenticated as `collierdev`
- **Token scopes**: gist, read:org, repo
- **Git protocol**: HTTPS

### ~~8. Jellyfin (Media Server)~~ ✓ COMPLETED
- **URL**: http://192.168.50.39:8096
- **Status**: Admin account created (Jan 12, 2026)

### 9. Home Assistant (Smart Home Hub)
- **URL**: http://192.168.50.39:8123
- **Status**: Running, integrated with Pi Dashboard
- **Action**: Add smart home devices and integrations as needed
- **Dashboard Access**: http://192.168.50.39 (Smart Home tab)
- **Steps**:
  1. Visit http://192.168.50.39:8123 to access Home Assistant directly
  2. Go to Settings > Devices & Services to add integrations
  3. Supported device types in dashboard: Lights, Switches, Climate, Media Players
  4. Devices will automatically appear in Pi Dashboard's Smart Home tab

### 10. go2rtc (Camera Streaming)
- **URL**: http://192.168.50.39:1984
- **Status**: Running with 5 cameras configured
- **Dashboard Access**: http://192.168.50.39 (Cameras section in Smart Home tab)
- **Cameras**:
  - Camera 1: 192.168.50.242
  - Camera 2: 192.168.50.246
  - Camera 3: 192.168.50.227
  - Camera 4: 192.168.50.73
  - Camera 5: 192.168.50.114
- **Features**: WebRTC/MSE/HLS streaming, HD/SD quality selection, fullscreen support

---

## Service Management Commands

```bash
# Docker
sudo systemctl status docker
sudo systemctl restart docker

# Jellyfin (Docker container)
sudo docker restart jellyfin      # Restart Jellyfin
sudo docker logs jellyfin         # View Jellyfin logs

# n8n (Docker container)
sudo docker ps                    # View running containers
sudo docker restart n8n           # Restart n8n
sudo docker logs n8n              # View n8n logs

# Plex Media Server
sudo systemctl status plexmediaserver
sudo systemctl restart plexmediaserver

# Ollama
sudo systemctl status ollama
sudo systemctl restart ollama
ollama list                       # List downloaded models
ollama pull <model-name>          # Download a model

# Portainer (Docker container)
sudo docker restart portainer     # Restart Portainer
sudo docker logs portainer        # View Portainer logs

# Tailscale
sudo systemctl status tailscaled
sudo systemctl restart tailscaled
tailscale status                  # View connection status
sudo tailscale up                 # Connect/authenticate
sudo tailscale down               # Disconnect

# GitHub CLI
gh auth login                     # Authenticate with GitHub
gh auth status                    # Check authentication status
gh repo clone <owner/repo>        # Clone a repository
gh repo create                    # Create a new repository
gh pr create                      # Create a pull request
gh pr list                        # List pull requests
gh issue list                     # List issues

# Home Assistant (Docker container)
sudo docker restart homeassistant  # Restart Home Assistant
sudo docker logs homeassistant     # View Home Assistant logs
# Access UI: http://192.168.50.39:8123
# Access via Dashboard: http://192.168.50.39 (Smart Home tab)

# go2rtc (Camera Streaming)
sudo docker restart go2rtc         # Restart go2rtc
sudo docker logs go2rtc            # View go2rtc logs
# Access UI: http://192.168.50.39:1984
# Config: ~/go2rtc/go2rtc.yaml

# tmux
tmux                              # Start new session
tmux ls                           # List sessions
tmux attach -t <name>             # Attach to session
# Inside tmux: Ctrl+B then D to detach

# fail2ban
sudo systemctl status fail2ban
sudo fail2ban-client status       # View jail status
sudo fail2ban-client status sshd  # View SSH jail details
sudo fail2ban-client unban <IP>   # Unban an IP
```

---

## ZFS Storage (Pool: blackbox)

The external 1TB drive is configured as a ZFS pool with optimized datasets.

### Datasets

| Dataset | Path | Purpose | Special Settings |
|---------|------|---------|------------------|
| `blackbox/media` | `/blackbox/media` | General media files | 1M recordsize |
| `blackbox/jellyfin` | `/blackbox/jellyfin` | Jellyfin library | 1M recordsize |
| `blackbox/plex` | `/blackbox/plex` | Plex library | 1M recordsize |
| `blackbox/backups` | `/blackbox/backups` | Backup storage | ZSTD compression |
| `blackbox/documents` | `/blackbox/documents` | Documents | Default |
| `blackbox/shared` | `/blackbox/shared` | Family/guest files | Default |
| `blackbox/docker` | `/blackbox/docker` | Container volumes | No snapshots |
| `blackbox/scratch` | `/blackbox/scratch` | Temp workspace | No snapshots |

### Features Enabled

- **Compression**: LZ4 (ZSTD for backups)
- **ARC limit**: 1GB (preserves RAM for other services)
- **Auto-snapshots**: 7 daily, 4 weekly, 3 monthly (except docker/scratch)
- **Monthly scrub**: 1st of each month at 2am

### ZFS Commands

```bash
zpool status blackbox      # Check pool health
zfs list                   # Show space usage
zfs list -t snapshot       # List snapshots
zpool scrub blackbox       # Manual integrity check
```

### Adding a Mirror (Future)

When adding a second drive for redundancy:
```bash
sudo zpool attach blackbox sda <new-drive>
```

---

## Samba File Sharing (Windows Access)

Access from Windows: `\\192.168.50.39` or `\\blackbox`

**Credentials**: `jwcollie` / `jkloo123`

### Shares

| Share | Path | Description |
|-------|------|-------------|
| `jwcollie` | `/home/jwcollie` | Home directory |
| `Media` | `/blackbox/media` | General media files |
| `Jellyfin` | `/blackbox/jellyfin` | Jellyfin library |
| `Plex` | `/blackbox/plex` | Plex library |
| `Backups` | `/blackbox/backups` | Backup storage |
| `Documents` | `/blackbox/documents` | Documents |
| `Shared` | `/blackbox/shared` | Family/guest files |
| `Docker` | `/blackbox/docker` | Container volumes |
| `Scratch` | `/blackbox/scratch` | Temp workspace |

### Windows Network Drive Mapping

Run in Windows Command Prompt (Admin):
```cmd
net use M: \\192.168.50.39\Media /user:jwcollie jkloo123 /persistent:yes
net use B: \\192.168.50.39\Backups /user:jwcollie jkloo123 /persistent:yes
net use D: \\192.168.50.39\Documents /user:jwcollie jkloo123 /persistent:yes
net use J: \\192.168.50.39\Jellyfin /user:jwcollie jkloo123 /persistent:yes
net use P: \\192.168.50.39\Plex /user:jwcollie jkloo123 /persistent:yes
net use S: \\192.168.50.39\Shared /user:jwcollie jkloo123 /persistent:yes
```

---

## Data Locations

| Software | Data Location | Backup Priority |
|----------|---------------|-----------------|
| Jellyfin | Docker volume: `jellyfin_config` | Medium |
| n8n | Docker volume: `n8n_data` | High |
| Plex | `/var/lib/plexmediaserver/` | Medium |
| Ollama | `/usr/share/ollama/.ollama/models/` | Low (re-download) |
| Portainer | Docker volume: `portainer_data` | Medium |
| Home Assistant | Docker volume: `homeassistant_config` | High |
| go2rtc | `/home/jwcollie/go2rtc/` | Medium |
| Tailscale | `/var/lib/tailscale/` | Low (re-auth) |
| fail2ban | `/etc/fail2ban/` | Low |
| ZFS Pool | `/blackbox/*` (all datasets) | High |
| Samba Config | `/etc/samba/smb.conf` | Medium |

---

## Already Installed on Your System (Pre-existing)

These tools were already present before this setup:
- git, htop, nano, curl, wget
- python3, pip3
- gcc, g++, make
- ffmpeg

---

## Network Ports in Use

| Port | Service | Protocol |
|------|---------|----------|
| 22 | SSH | TCP |
| 80 | Pi Dashboard | HTTP |
| 139 | Samba (NetBIOS) | TCP |
| 445 | Samba (SMB) | TCP |
| 1984 | go2rtc (Web/API/WebRTC) | HTTP |
| 5678 | n8n | HTTP |
| 8096 | Jellyfin | HTTP |
| 8123 | Home Assistant | HTTP |
| 8554 | go2rtc (RTSP) | TCP |
| 9443 | Portainer | HTTPS |
| 11434 | Ollama API | HTTP |
| 32400 | Plex | HTTP |
| 41641 | Tailscale (UDP) | UDP |

---

## Pi Dashboard

A custom real-time web dashboard for monitoring and managing the Raspberry Pi.

- **URL**: http://192.168.50.39
- **Container**: `pi-dashboard`
- **Source**: `~/Dashboard/`

### Features

- **Tab Navigation**: System and Smart Home tabs
- **System Stats**: CPU, memory, disk, temperature (real-time via WebSocket)
- **Service Management**: Start/stop/restart Docker containers and systemd services
- **Network Services Table**: All services with IPs, ports, and clickable URLs
- **Memory Usage Table**: Top processes by memory (sortable by name, memory, CPU)
- **Network Interfaces**: Shows eth0, tailscale0, docker0 with IPs
- **AI Chat**: Integration with Ollama (local) and Claude API
- **Home Assistant Integration**: Control smart home devices directly from dashboard
  - Light controls (on/off, brightness)
  - Switch/outlet controls (on/off)
  - Climate controls (temperature adjustment)
  - Media player controls (play/pause, volume)

### Docker Run Command

```bash
sudo docker run -d --name pi-dashboard --restart=always \
  -p 80:80 \
  --pid=host \
  --privileged \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  pi-dashboard
```

### Rebuild and Redeploy

```bash
cd ~/Dashboard
sudo docker stop pi-dashboard && sudo docker rm pi-dashboard
docker build -t pi-dashboard .
sudo docker run -d --name pi-dashboard --restart=always \
  -p 80:80 --pid=host --privileged \
  -v /var/run/docker.sock:/var/run/docker.sock:ro pi-dashboard
```

---

## Notes

- User `jwcollie` has been added to the `docker` group (log out/in for effect without sudo)
- All Docker containers set to `--restart=always` for auto-start on boot
- fail2ban is automatically protecting SSH with default settings
- Tailscale provides secure access without opening firewall ports
