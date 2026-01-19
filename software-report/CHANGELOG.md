# Installation Changelog

This file tracks all software installations with dates, versions, and commands used.
Use this for troubleshooting or rollback reference.

> **Note**: This file is maintained by Claude Code. Add entries when installing, updating, or removing software.

---

## January 19, 2026

### [Documentation Update] All System Documentation Updated
- **Type**: Documentation maintenance
- **Changes**:
  - Updated INSTALLATION_REPORT.md with current date and go2rtc service
  - Updated CHANGELOG.md with go2rtc installation entry
  - Updated CLAUDE.md with go2rtc service listing
  - Marked completed setup tasks (n8n, Plex, Portainer, Tailscale, Jellyfin, Ollama, GitHub CLI)
  - Added go2rtc to network ports table and data locations
- **Status**: All documentation now reflects actual system state

---

## January 15, 2026

### [18:00] Pi Dashboard - Draggable SystemStats Panels Deployment
- **Type**: Docker container update and deployment
- **Changes**:
  - Fixed TypeScript compilation errors in SystemStats component
  - Implemented draggable panels for Network Services and Memory Usage tables
  - Panel order persists via localStorage
  - Proper dnd-kit configuration with PointerSensor activation constraint
- **Fixed Issues**:
  - Removed unused ChevronDown/ChevronUp imports
  - Fixed PointerSensor configuration: `activationConstraint: { distance: 8 }` instead of `distance: 8`
- **Files Modified**:
  - `client/src/components/SystemStats.tsx` - Fixed imports and dnd-kit sensor config
- **Build Process**:
  1. `cd ~/Dashboard/client && npm run build` - Frontend built successfully (1915 modules, 475KB JS)
  2. `cd ~/Dashboard && sudo docker build -t pi-dashboard .` - Docker image built (multi-stage)
  3. Container redeployed with proper flags: `--pid=host --privileged --restart=always`
- **Verification**:
  - Container status: Running (0bf109dd4a2f)
  - Health check: `curl http://192.168.50.39/api/health` → 200 OK
  - Logs: Server running on port 80, clients connected
- **Features Active**:
  - Draggable Network Services panel
  - Draggable Memory Usage by Process panel
  - Persistent panel ordering in localStorage
  - Collapsible panels with badge counts
  - Real-time stats updates via Socket.io
- **Access**: http://192.168.50.39

### [04:30] Claude Code Custom Agents & Configuration
- **Type**: Claude Code configuration
- **Documentation**: `~/software-report/CLAUDE_AGENTS.md`

**Custom Agents Created** (`~/.claude/agents/`):
| Agent | File | Purpose |
|-------|------|---------|
| frontend | `frontend.md` | UI/React/CSS/Playwright E2E testing |
| backend | `backend.md` | APIs/databases/server logic |
| syseng | `syseng.md` | Infrastructure/Docker/networking/ZFS |
| pm | `pm.md` | PRDs/specs/project planning |

**Agent Configuration**:
- Model: Sonnet (all agents)
- Permission Mode: `bypassPermissions` (full automation)
- Tools: Read, Edit, Write, Grep, Glob, Bash

**MCP Server Installed**:
- **mcp-memory-keeper** - Persists context across sessions
- Location: `/usr/bin/mcp-memory-keeper`
- Config: `~/.claude/settings.json`

**Pre-Approved Commands** (`~/.claude/settings.json`):
- 70+ bash commands auto-approved (npm, git, docker, systemctl, zfs, networking, etc.)
- No permission prompts for routine operations

**To revert to safer mode**:
Edit each agent file in `~/.claude/agents/` and change:
```yaml
permissionMode: bypassPermissions
```
to:
```yaml
permissionMode: acceptEdits  # or "default"
```

**To remove**:
```bash
rm -rf ~/.claude/agents/
rm ~/.claude/settings.json
sudo npm uninstall -g mcp-memory-keeper
```

---

## January 14, 2026

### [19:16] go2rtc 1.9.13 (Camera Streaming Server)
- **Version**: 1.9.13
- **Type**: Docker container
- **Command used**:
```bash
sudo docker run -d --name go2rtc --restart=always \
  --network=host \
  -v ~/go2rtc:/config \
  alexxit/go2rtc:latest
```
- **Access**: http://192.168.50.39:1984 (Web UI/API), RTSP on port 8554
- **Config location**: `~/go2rtc/go2rtc.yaml`
- **Cameras configured**: 5 cameras (IPs: .242, .246, .227, .73, .114)
- **Features**:
  - RTSP to WebRTC/MSE/HLS conversion
  - HD and SD streams for each camera
  - Low-latency streaming
  - Integrated with Pi Dashboard Smart Home tab
- **Dashboard Integration**:
  - Camera grid view with fullscreen support
  - Quality selection (HD/SD)
  - Custom camera naming (persists in localStorage)
  - Multiple streaming modes: WebRTC, MSE, HLS, MJPEG
- **To remove**:
```bash
sudo docker stop go2rtc && sudo docker rm go2rtc
rm -rf ~/go2rtc
```

---

## January 13, 2026

### [05:45] Home Assistant (Smart Home Hub)
- **Version**: Latest stable
- **Type**: Docker container
- **Command used**:
```bash
sudo docker run -d \
  --name homeassistant \
  --restart=always \
  --privileged \
  -v homeassistant_config:/config \
  -v /etc/localtime:/etc/localtime:ro \
  -v /run/dbus:/run/dbus:ro \
  --network=host \
  homeassistant/home-assistant:stable
```
- **Access**: http://192.168.50.39:8123
- **Dashboard Integration**: Full integration with Pi Dashboard
  - Tab navigation (System / Smart Home)
  - Collapsed summary on main dashboard
  - Device controls: Lights, Switches, Climate, Media Players
  - Real-time state updates via Socket.io
- **API Token**: Stored in `server/src/config/homeassistant.ts`
- **To remove**:
```bash
sudo docker stop homeassistant && sudo docker rm homeassistant
sudo docker volume rm homeassistant_config
```

### [05:45] Pi Dashboard - Home Assistant Integration
- **Type**: Docker container update
- **New Features**:
  - Tab navigation (System / Smart Home tabs)
  - Home Assistant device control panel
  - LightCard, SwitchCard, ClimateCard, MediaPlayerCard components
  - Real-time device state updates
  - Collapsed summary view on main dashboard
- **New Files**:
  - `server/src/config/homeassistant.ts` - HA configuration
  - `server/src/utils/homeassistant.ts` - HA API client
  - `server/src/routes/homeassistant.ts` - REST endpoints
  - `client/src/components/HomeAssistant.tsx` - Main component
  - `client/src/components/homeassistant/*.tsx` - Device cards
- **API Endpoints**:
  - `GET /api/homeassistant/status` - Connection status
  - `GET /api/homeassistant/devices` - List all devices
  - `POST /api/homeassistant/entities/:id/toggle` - Toggle device

### [05:28] GitHub CLI 2.83.2
- **Version**: 2.83.2
- **Type**: System package (official GitHub repo)
- **Command used**:
```bash
wget -nv -O- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null
echo "deb [arch=arm64 signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list
sudo apt update && sudo apt install gh -y
```
- **Usage**:
  - `gh auth login` - Authenticate with GitHub
  - `gh repo clone <repo>` - Clone a repository
  - `gh pr create` - Create a pull request
  - `gh issue list` - List issues
- **To remove**:
```bash
sudo apt remove --purge gh
sudo rm /etc/apt/sources.list.d/github-cli.list
sudo rm /etc/apt/keyrings/githubcli-archive-keyring.gpg
```

### [05:30] Pi Dashboard - Major Update (Host System Integration)
- **Type**: Docker container update
- **Changes**:
  - Fixed systemd service detection (Plex, Ollama, Tailscale, Samba now show correct status)
  - Added Memory Usage by Process table (sortable, hideable)
  - Added Network Services table with IPs and ports
  - Added real host data via `nsenter` (processes, network interfaces, memory, disk)
  - Shows actual hostname "blackbox" instead of container ID
  - Shows correct Debian 13 (trixie) platform info
- **New Docker run command** (requires `--pid=host` and `--privileged`):
```bash
sudo docker run -d --name pi-dashboard --restart=always \
  -p 80:80 \
  --pid=host \
  --privileged \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  pi-dashboard
```
- **Dockerfile changes**:
  - Added `util-linux` for `nsenter`
  - Added `procps` for `ps` command
  - Added `iproute2` for `ip` command
- **Server changes** (`server/src/utils/systemInfo.ts`):
  - `getHostProcesses()` - Gets top processes from host via `nsenter`
  - `getHostNetworkInterfaces()` - Gets host network interfaces via `nsenter`
  - `getHostSystemInfo()` - Gets hostname, platform, uptime from host
  - `getHostMemoryInfo()` - Gets memory stats from host `/proc/meminfo`
  - `getHostDiskInfo()` - Gets disk stats from host `df`
- **To rebuild**:
```bash
cd ~/Dashboard
sudo docker stop pi-dashboard && sudo docker rm pi-dashboard
docker build -t pi-dashboard .
sudo docker run -d --name pi-dashboard --restart=always \
  -p 80:80 --pid=host --privileged \
  -v /var/run/docker.sock:/var/run/docker.sock:ro pi-dashboard
```

### [04:45] ZFS Pool: blackbox (Storage)
- **Version**: ZFS 2.3.1
- **Type**: Kernel module + userspace tools
- **Pool**: `blackbox` on `/dev/sda` (899GB)
- **Command used**:
```bash
sudo zpool create -f \
  -o ashift=12 \
  -O compression=lz4 \
  -O atime=off \
  -O xattr=sa \
  -O acltype=posixacl \
  -O mountpoint=/blackbox \
  blackbox /dev/sda
```
- **Datasets created**:
  - `blackbox/media` (recordsize=1M)
  - `blackbox/jellyfin` (recordsize=1M)
  - `blackbox/plex` (recordsize=1M)
  - `blackbox/backups` (compression=zstd)
  - `blackbox/documents`
  - `blackbox/shared`
  - `blackbox/docker` (no snapshots)
  - `blackbox/scratch` (no snapshots)
- **Features**:
  - ARC limit: 1GB (`/etc/modprobe.d/zfs.conf`)
  - Auto-snapshots: 7 daily, 4 weekly, 3 monthly
  - Monthly scrub: `/etc/cron.d/zfs-scrub`
- **To remove**:
```bash
sudo zpool destroy blackbox
sudo apt remove --purge zfsutils-linux zfs-auto-snapshot
```

### [04:30] zfs-auto-snapshot 1.2.4
- **Version**: 1.2.4
- **Type**: System package
- **Command used**:
```bash
sudo apt install -y zfs-auto-snapshot
```
- **Retention configured**:
  - Daily: 7 snapshots
  - Weekly: 4 snapshots
  - Monthly: 3 snapshots
- **To remove**:
```bash
sudo apt remove --purge zfs-auto-snapshot
```

### [04:15] Samba 4.22.6 (Windows File Sharing)
- **Version**: 4.22.6
- **Type**: System package
- **Command used**:
```bash
sudo apt install -y samba samba-common-bin
```
- **Config**: `/etc/samba/smb.conf`
- **Access**: `\\192.168.50.39` or `\\blackbox`
- **Credentials**: `jwcollie` / `jkloo123`
- **Shares configured**:
  - `homes` - User home directories
  - `Media`, `Jellyfin`, `Plex` - Media shares
  - `Backups`, `Documents`, `Shared` - Data shares
  - `Docker`, `Scratch` - System shares
- **To remove**:
```bash
sudo apt remove --purge samba samba-common-bin
sudo rm -rf /etc/samba
```

---

## January 12, 2026

### Jellyfin (Media Server)
- **Version**: Latest
- **Type**: Docker container
- **Command used**:
```bash
sudo docker run -d --name jellyfin --restart=always \
  -p 8096:8096 \
  -v jellyfin_config:/config \
  -v jellyfin_cache:/cache \
  jellyfin/jellyfin:latest
```
- **Access**: http://192.168.50.39:8096
- **Data location**: Docker volumes `jellyfin_config`, `jellyfin_cache`
- **To remove**:
```bash
sudo docker stop jellyfin && sudo docker rm jellyfin
sudo docker volume rm jellyfin_config jellyfin_cache
```

### [01:30] n8n - Fixed Secure Cookie Issue
- **Issue**: Browser showed "secure cookie" error over HTTP
- **Fix**: Recreated container with `N8N_SECURE_COOKIE=false`
- **Command used**:
```bash
sudo docker stop n8n && sudo docker rm n8n
sudo docker run -d --restart always --name n8n -p 5678:5678 \
  -e N8N_SECURE_COOKIE=false \
  -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```
- **Note**: Data preserved in `n8n_data` volume

### [00:57] neovim 0.10.4 (Text Editor)
- **Version**: 0.10.4
- **Type**: System package
- **Command used**:
```bash
sudo apt-get install -y neovim
```
- **Note**: Set as default vi/vim via update-alternatives
- **To remove**:
```bash
sudo apt-get remove --purge neovim
```

### [00:57] Node.js 24.12.0 (JavaScript Runtime)
- **Version**: 24.12.0 (npm 11.6.2)
- **Type**: System package (NodeSource repo)
- **Command used**:
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```
- **To remove**:
```bash
sudo apt-get remove --purge nodejs
sudo rm /etc/apt/sources.list.d/nodesource.list
```

### [00:45] SOFTWARE_SUGGESTIONS.md Updated
- Expanded from 11 to 47 software suggestions
- Added categories: Self-Hosted Cloud, Development, AI/ML, Dashboards, Communication, Entertainment, Utilities
- Added port reference table for all suggested services

### [00:20] Portainer CE (Docker GUI)
- **Version**: Latest (CE)
- **Type**: Docker container
- **Command used**:
```bash
sudo docker volume create portainer_data
sudo docker run -d -p 9443:9443 --name portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data portainer/portainer-ce:latest
```
- **Access**: https://192.168.50.39:9443
- **Data location**: Docker volume `portainer_data`
- **To remove**:
```bash
sudo docker stop portainer && sudo docker rm portainer
sudo docker volume rm portainer_data
```

### [00:20] Tailscale 1.92.5 (VPN)
- **Version**: 1.92.5
- **Type**: System package
- **Command used**:
```bash
curl -fsSL https://tailscale.com/install.sh | sh
```
- **Service**: `tailscaled.service`
- **Config location**: `/var/lib/tailscale/`
- **To remove**:
```bash
sudo apt-get remove --purge tailscale
sudo rm -rf /var/lib/tailscale
```

### [00:20] tmux 3.5a (Terminal Multiplexer)
- **Version**: 3.5a
- **Type**: System package
- **Command used**:
```bash
sudo apt-get install -y tmux
```
- **To remove**:
```bash
sudo apt-get remove --purge tmux
```

### [00:20] fail2ban 1.1.0 (Intrusion Prevention)
- **Version**: 1.1.0
- **Type**: System package
- **Command used**:
```bash
sudo apt-get install -y fail2ban
```
- **Service**: `fail2ban.service`
- **Config location**: `/etc/fail2ban/`
- **To remove**:
```bash
sudo apt-get remove --purge fail2ban
```

---

## January 11, 2026

### [23:35] Plex Media Server 1.42.2.10156
- **Version**: 1.42.2.10156-f737b826c
- **Type**: System package
- **Command used**:
```bash
curl https://downloads.plex.tv/plex-keys/PlexSign.key | sudo gpg --dearmor -o /usr/share/keyrings/plex-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/plex-archive-keyring.gpg] https://downloads.plex.tv/repo/deb public main" | sudo tee /etc/apt/sources.list.d/plexmediaserver.list
sudo apt-get update && sudo apt-get install -y plexmediaserver
```
- **Service**: `plexmediaserver.service`
- **Access**: http://192.168.50.39:32400/web
- **Data location**: `/var/lib/plexmediaserver/`
- **To remove**:
```bash
sudo apt-get remove --purge plexmediaserver
sudo rm -rf /var/lib/plexmediaserver
```

### [23:35] VS Code 1.108.0
- **Version**: 1.108.0-1767881953
- **Type**: System package
- **Command used**:
```bash
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /tmp/packages.microsoft.gpg
sudo install -D -o root -g root -m 644 /tmp/packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg
echo "deb [arch=arm64 signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list
sudo apt-get update && sudo apt-get install -y code
```
- **To remove**:
```bash
sudo apt-get remove --purge code
```

### [23:31] Ollama 0.13.5 (Local LLM)
- **Version**: 0.13.5
- **Type**: Binary installation
- **Command used**:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```
- **Service**: `ollama.service`
- **Binary location**: `/usr/local/bin/ollama`
- **Models location**: `/usr/share/ollama/.ollama/models/`
- **Note**: Running in CPU-only mode (no GPU)
- **To remove**:
```bash
sudo systemctl stop ollama
sudo rm /usr/local/bin/ollama
sudo rm -rf /usr/share/ollama
sudo userdel ollama
sudo rm /etc/systemd/system/ollama.service
```

### [23:22] n8n (Workflow Automation)
- **Version**: Latest
- **Type**: Docker container
- **Command used**:
```bash
sudo docker volume create n8n_data
sudo docker run -d --restart always --name n8n -p 5678:5678 \
  -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```
- **Access**: http://192.168.50.39:5678
- **Data location**: Docker volume `n8n_data`
- **To remove**:
```bash
sudo docker stop n8n && sudo docker rm n8n
sudo docker volume rm n8n_data
```

### [19:17] Docker 29.1.4
- **Version**: 29.1.4, build 0e6fee6
- **Type**: System package
- **Command used**:
```bash
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sudo sh /tmp/get-docker.sh
sudo usermod -aG docker jwcollie
```
- **Service**: `docker.service`
- **Note**: User must log out/in for docker group to take effect
- **To remove**:
```bash
sudo apt-get remove --purge docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo rm -rf /var/lib/docker
```

---

## Rollback Procedures

### If Docker containers break:
```bash
# View all containers (including stopped)
sudo docker ps -a

# View container logs
sudo docker logs <container-name>

# Restart container
sudo docker restart <container-name>

# Remove and recreate (data preserved in volume)
sudo docker stop <container-name>
sudo docker rm <container-name>
# Then run original docker run command again
```

### If system service won't start:
```bash
# Check service status
sudo systemctl status <service-name>

# View detailed logs
sudo journalctl -u <service-name> -n 50

# Restart service
sudo systemctl restart <service-name>

# Reset failed state
sudo systemctl reset-failed <service-name>
```

### If apt package breaks:
```bash
# Reinstall package
sudo apt-get install --reinstall <package-name>

# Fix broken dependencies
sudo apt-get -f install

# Reconfigure package
sudo dpkg --configure -a
```

---

## Pre-existing Software (Not installed by this process)

These were already on the system:
- git
- htop
- nano
- curl
- wget
- python3, pip3
- gcc, g++, make
- ffmpeg
