# Blackbox Homelab — Raspberry Pi 5 Platform

A self-hosted homelab and dashboard stack running on a Raspberry Pi 5. Bundles a custom React/Node dashboard, Home Assistant, MQTT, Govee bridge, media servers, camera streaming, automation, and a graph database — all behind an nginx reverse proxy with friendly `*.blackbox` URLs.

- **Host**: Raspberry Pi 5 (ARM64 / aarch64)
- **OS**: Debian GNU/Linux 13 (trixie)
- **Static IP**: `192.168.50.39`
- **Primary URL**: `http://blackbox/` (or `http://192.168.50.39:8080`)

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Prerequisites](#2-prerequisites)
3. [Base System Setup](#3-base-system-setup)
4. [Install Docker & Docker Compose](#4-install-docker--docker-compose)
5. [Install Node.js & Build Tools](#5-install-nodejs--build-tools)
6. [Install Portainer (Docker UI)](#6-install-portainer-docker-ui)
7. [Install Mosquitto (MQTT Broker)](#7-install-mosquitto-mqtt-broker)
8. [Install Home Assistant](#8-install-home-assistant)
9. [Install govee2mqtt (Govee → MQTT Bridge)](#9-install-govee2mqtt-govee--mqtt-bridge)
10. [Install go2rtc (Camera Streaming)](#10-install-go2rtc-camera-streaming)
11. [Install n8n (Workflow Automation)](#11-install-n8n-workflow-automation)
12. [Install Jellyfin / Plex (Media)](#12-install-jellyfin--plex-media)
13. [Install Neo4j (Graph Database)](#13-install-neo4j-graph-database)
14. [Install nginx Reverse Proxy + dnsmasq](#14-install-nginx-reverse-proxy--dnsmasq)
15. [Install the Pi Dashboard (React + Node)](#15-install-the-pi-dashboard-react--node)
16. [Optional Services](#16-optional-services)
17. [Open Source Software & Libraries Used](#17-open-source-software--libraries-used)
18. [Maintenance](#18-maintenance)

---

## 1. Platform Overview

| Layer | Tool |
|------|------|
| OS | Debian 13 (trixie) on Pi 5 |
| Container runtime | Docker Engine + Compose v2 |
| Reverse proxy | nginx |
| Local DNS | dnsmasq (`*.blackbox` → `192.168.50.39`) |
| Storage | ZFS pool `blackbox` (LZ4 + auto-snapshots) |
| File sharing | Samba (`\\blackbox`) |
| Smart home | Home Assistant + Mosquitto MQTT + govee2mqtt |
| Cameras | go2rtc |
| Media | Jellyfin, Plex |
| Automation | n8n |
| AI / LLM | Ollama (local models) |
| Database | Neo4j (graph), CouchDB (LiveSync vault) |
| Dashboard | Custom React 19 + Express 5 app |

---

## 2. Prerequisites

### Hardware

- Raspberry Pi 5 (4 GB or 8 GB)
- 64 GB+ microSD or NVMe boot drive
- External USB drive for ZFS pool (optional but recommended)
- Wired ethernet (more reliable than Wi-Fi for a server)

### Network

- Static DHCP reservation or static IP for the Pi (this guide uses `192.168.50.39`)
- Open ports on the LAN: `22, 53, 80, 443, 1883, 1984, 5678, 8080, 8096, 8123, 32400`

### Software you should have first

- Raspberry Pi OS Lite (64-bit) **or** Debian 13 ARM64
- A workstation with SSH access to the Pi
- A GitHub account (for `gh` CLI and cloning repos)

### Accounts / API keys you'll want eventually

- Govee Developer API key (for `govee2mqtt`)
- Google or Microsoft OAuth credentials (for calendar sync — optional)
- Tailscale account (for remote access — optional)

---

## 3. Base System Setup

```bash
# Update everything
sudo apt update && sudo apt full-upgrade -y

# Core utilities
sudo apt install -y \
  git curl wget unzip ca-certificates gnupg lsb-release \
  build-essential python3 python3-pip \
  tmux htop neofetch jq \
  fail2ban ufw

# Add yourself to a few useful groups (re-login after this)
sudo usermod -aG docker,sudo $USER
```

`★ Insight ─────────────────────────────────────`
`build-essential` (gcc, g++, make) is needed because several npm packages (notably `dockerode` and `node-ical`) compile native bindings on ARM64 the first time you `npm install`.
`─────────────────────────────────────────────────`

---

## 4. Install Docker & Docker Compose

```bash
# Official Docker apt repo (works on Debian 13)
curl -fsSL https://download.docker.com/linux/debian/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
                    docker-buildx-plugin docker-compose-plugin

# Test
docker --version
docker compose version
```

Log out and back in so your group membership takes effect (no more `sudo docker`).

---

## 5. Install Node.js & Build Tools

The Pi Dashboard targets **Node.js 24.x** and **npm 11.x**.

```bash
# Install Node 24 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

node --version   # v24.x
npm  --version   # 11.x
```

---

## 6. Install Portainer (Docker UI)

```bash
docker volume create portainer_data

docker run -d \
  --name portainer \
  --restart=always \
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Open `https://192.168.50.39:9443` and create the admin user on first launch.

---

## 7. Install Mosquitto (MQTT Broker)

Mosquitto is the message bus that connects Home Assistant, govee2mqtt, and any other MQTT producers/consumers.

```bash
mkdir -p ~/mosquitto/{config,data,log}

cat > ~/mosquitto/config/mosquitto.conf <<'EOF'
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwd
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
EOF

# Create a user (you will be prompted for a password)
docker run -it --rm \
  -v ~/mosquitto/config:/mosquitto/config \
  eclipse-mosquitto:2 \
  mosquitto_passwd -c /mosquitto/config/passwd mqttuser

# Run the broker
docker run -d \
  --name mosquitto \
  --restart=always \
  -p 1883:1883 \
  -v ~/mosquitto/config:/mosquitto/config \
  -v ~/mosquitto/data:/mosquitto/data \
  -v ~/mosquitto/log:/mosquitto/log \
  eclipse-mosquitto:2
```

Test from another machine: `mosquitto_pub -h 192.168.50.39 -u mqttuser -P <pw> -t test -m hello`.

---

## 8. Install Home Assistant

```bash
docker volume create homeassistant_config

docker run -d \
  --name homeassistant \
  --restart=always \
  --privileged \
  --network=host \
  -e TZ=America/Chicago \
  -v homeassistant_config:/config \
  -v /run/dbus:/run/dbus:ro \
  ghcr.io/home-assistant/home-assistant:stable
```

Open `http://192.168.50.39:8123`, create the owner account, then:

1. **Settings → Devices & Services → Add Integration → MQTT**
2. Point it at `192.168.50.39:1883` with the `mqttuser` credentials above.
3. Generate a **Long-Lived Access Token** (profile menu) — you'll paste this into the dashboard `.env` as `HA_TOKEN`.

`★ Insight ─────────────────────────────────────`
`--network=host` is required so HA can do mDNS discovery for Sonos, HomeKit, ESPHome, etc. The trade-off is you can't put HA behind a Docker bridge, so it shares the host's port table with everything else — that's why we use nginx subdomains rather than path prefixes for it.
`─────────────────────────────────────────────────`

---

## 9. Install govee2mqtt (Govee → MQTT Bridge)

Bridges Govee LAN/BLE devices into MQTT so Home Assistant can autodiscover them.

```bash
mkdir -p ~/govee2mqtt
cat > ~/govee2mqtt/govee.toml <<'EOF'
[govee]
api_key = "YOUR_GOVEE_API_KEY"

[mqtt]
host = "192.168.50.39"
port = 1883
user = "mqttuser"
password = "YOUR_MQTT_PASSWORD"
EOF

docker run -d \
  --name govee2mqtt \
  --restart=always \
  --network=host \
  -v ~/govee2mqtt/govee.toml:/etc/govee.toml:ro \
  -e RUST_LOG=info \
  ghcr.io/wez/govee2mqtt:latest
```

Get a free API key at <https://developer.govee.com/>. Within ~30 seconds your Govee lights will appear under **Settings → Devices** in Home Assistant via MQTT autodiscovery.

---

## 10. Install go2rtc (Camera Streaming)

```bash
mkdir -p ~/go2rtc
cat > ~/go2rtc/go2rtc.yaml <<'EOF'
streams:
  # example:
  # front_door: rtsp://user:pass@192.168.50.50/stream1
api:
  listen: ":1984"
EOF

docker run -d \
  --name go2rtc \
  --restart=always \
  --network=host \
  -v ~/go2rtc/go2rtc.yaml:/config/go2rtc.yaml \
  alexxit/go2rtc:latest
```

Web UI: `http://192.168.50.39:1984`.

---

## 11. Install n8n (Workflow Automation)

```bash
docker volume create n8n_data

docker run -d \
  --name n8n \
  --restart=always \
  -p 5678:5678 \
  -e GENERIC_TIMEZONE=America/Chicago \
  -e N8N_HOST=n8n.blackbox \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n:latest
```

Open `http://192.168.50.39:5678`, create the admin account.

---

## 12. Install Jellyfin / Plex (Media)

### Jellyfin

```bash
docker volume create jellyfin_config

docker run -d \
  --name jellyfin \
  --restart=always \
  -p 8096:8096 \
  -v jellyfin_config:/config \
  -v /blackbox/jellyfin:/media:ro \
  jellyfin/jellyfin:latest
```

### Plex (system package — uses host hardware codecs better)

```bash
sudo apt install -y plexmediaserver
sudo systemctl enable --now plexmediaserver
```

Plex web UI: `http://192.168.50.39:32400/web`.

---

## 13. Install Neo4j (Graph Database)

The Pi Dashboard uses Neo4j as its primary store for tasks, planner relationships, and encrypted OAuth tokens.

It is started **automatically** by the Pi Dashboard's `docker-compose.yml` (see section 15), so you typically don't run it standalone. If you want a manual install:

```bash
docker run -d \
  --name neo4j \
  --restart=always \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/change_me \
  -e NEO4J_PLUGINS='["apoc"]' \
  -v neo4j_data:/data \
  neo4j:5.15
```

Browser: `http://192.168.50.39:7474`.

---

## 14. Install nginx Reverse Proxy + dnsmasq

```bash
sudo apt install -y nginx dnsmasq
```

### dnsmasq — wildcard DNS for `*.blackbox`

```bash
sudo tee /etc/dnsmasq.d/blackbox.conf <<'EOF'
address=/blackbox/192.168.50.39
EOF
sudo systemctl restart dnsmasq
```

### nginx — friendly URLs

Create one server block per service, e.g.:

```nginx
# /etc/nginx/sites-available/jellyfin.blackbox
server {
  listen 80;
  server_name jellyfin.blackbox;
  location / {
    proxy_pass http://127.0.0.1:8096;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Then:

```bash
sudo ln -s /etc/nginx/sites-available/jellyfin.blackbox /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Repeat for `n8n.blackbox`, `ha.blackbox`, `go2rtc.blackbox`, `plex.blackbox`, `vault.blackbox` (HTTPS), and a root vhost for the dashboard at `blackbox/`.

To use the friendly names from any device on the LAN, set `192.168.50.39` as the primary DNS server in your router's DHCP settings.

---

## 15. Install the Pi Dashboard (React + Node)

The Dashboard lives in `~/Dashboard` and contains:

- `client/` — React 19 + Vite 7 + TailwindCSS 4 frontend
- `server/` — Express 5 + TypeScript + Socket.IO API
- `docker-compose.yml` — brings up Neo4j + the dashboard

### One-time clone & configure

```bash
cd ~
git clone <your-repo-url> Dashboard
cd Dashboard

cp .env.example .env
# Edit .env — at minimum set these:
#   NEO4J_PASSWORD=<strong password>
#   ENCRYPTION_SECRET=$(openssl rand -base64 32)
#   HA_URL=http://192.168.50.39:8123
#   HA_TOKEN=<paste Long-Lived Access Token from HA>
nano .env
```

### Start it

```bash
docker compose up -d --build
```

Open `http://localhost:8080` (or `http://blackbox/`).

### Run from source (development mode)

```bash
cd ~/Dashboard
npm install                       # root tooling (concurrently, playwright)
(cd server && npm install)
(cd client && npm install)
npm run dev                       # starts client (vite) + server (nodemon) together
```

- Client dev server: `http://localhost:5173`
- API server: `http://localhost:8080`

### OAuth (optional)

In **Settings → Calendar → OAuth Provider Setup** paste Google or Microsoft client IDs/secrets — they're encrypted with `ENCRYPTION_SECRET` and stored in Neo4j, so you don't have to commit them. Or upload a `.zip`/`.ics` Google Takeout export if you'd rather skip OAuth entirely.

---

## 16. Optional Services

| Service | Purpose | Quick install |
|--------|--------|--------------|
| **CouchDB** | Obsidian LiveSync vault backend | `docker run -d --name couchdb -p 5984:5984 -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=... couchdb:3` |
| **Ollama** | Local LLM runtime (used by AI chat panel) | `curl -fsSL https://ollama.com/install.sh \| sh` then `ollama pull llama3.2` |
| **Tailscale** | Encrypted remote access | `curl -fsSL https://tailscale.com/install.sh \| sh && sudo tailscale up` |
| **Samba** | Windows file shares for ZFS datasets | `sudo apt install samba` and edit `/etc/samba/smb.conf` |
| **ZFS** | Snapshots + compression for `/blackbox` | `sudo apt install zfsutils-linux` then `zpool create blackbox /dev/sda` |
| **fail2ban** | SSH brute-force protection | `sudo apt install fail2ban` (already in Section 3) |
| **GitHub CLI** | `gh` for repo management | `sudo apt install gh && gh auth login` |
| **Obsidian** | Markdown notes app (AppImage) | Drop the AppImage in `~/obsidian/` |

---

## 17. Open Source Software & Libraries Used

### Server-side platform

| Project | Role | License |
|--------|------|--------|
| Debian 13 | OS | Various FOSS |
| Docker Engine | Containers | Apache-2.0 |
| nginx | Reverse proxy | BSD-2-Clause |
| dnsmasq | Local DNS | GPL-2.0 |
| Mosquitto | MQTT broker | EPL/EDL |
| Home Assistant | Smart-home hub | Apache-2.0 |
| govee2mqtt (wez/govee2mqtt) | Govee MQTT bridge | MIT |
| go2rtc | Camera multiplexer | MIT |
| n8n | Workflow automation | Sustainable Use License |
| Jellyfin | Media server | GPL-2.0 |
| Plex | Media server | Proprietary (free tier) |
| Portainer CE | Docker UI | zlib |
| Neo4j Community | Graph DB | GPL-3.0 |
| CouchDB | LiveSync vault | Apache-2.0 |
| Ollama | Local LLM runtime | MIT |
| Samba | SMB file sharing | GPL-3.0 |
| ZFS on Linux | Filesystem | CDDL |
| Tailscale | Mesh VPN | BSD-3-Clause |
| fail2ban | Intrusion prevention | GPL-2.0 |

### Pi Dashboard — server (`server/package.json`)

- **express 5** — HTTP framework
- **socket.io 4** — real-time stats stream
- **dockerode 4** — Docker Engine API client
- **systeminformation 5** — CPU, memory, temperature, disk metrics
- **neo4j-driver 5** — Cypher client
- **googleapis 130** + **@microsoft/microsoft-graph-client 3** — calendar sync
- **tsdav 2** — CalDAV client
- **node-ical 0.26** + **rrule 2** — `.ics` parsing & recurrence
- **adm-zip** — Google Takeout `.zip` import
- **chokidar** — TODO.md file watching
- **cron 3** — scheduled syncs
- **date-fns 3** — date math
- **uuid 9** — id generation
- **cors 2** — CORS middleware
- **TypeScript 5.9**, **ts-node**, **nodemon** — dev tooling

### Pi Dashboard — client (`client/package.json`)

- **react 19** + **react-dom 19**
- **vite 7** — build tool
- **typescript 5.9**
- **tailwindcss 4** + **@tailwindcss/vite**
- **@tanstack/react-query 5** — server state
- **socket.io-client 4** — live metrics
- **react-hook-form 7** + **@hookform/resolvers 3** + **zod 3** — forms & validation
- **@dnd-kit/{core,sortable,utilities}** — drag-and-drop planner
- **d3 7** — charting
- **lucide-react** — icons
- **react-markdown 10** — markdown rendering (AI chat, notes)
- **eslint 9** + **typescript-eslint 8** + **eslint-plugin-react-hooks/refresh** — linting

### Test tooling

- **@playwright/test 1.57** — E2E (`~/Dashboard/e2e-tests`)
- **concurrently 9** — runs client + server together in dev

---

## 18. Maintenance

```bash
# Update host packages
sudo apt update && sudo apt full-upgrade -y

# Update Docker images
docker compose pull && docker compose up -d
docker image prune -f

# Watch dashboard logs
docker logs -f pi-dashboard
docker logs -f pi-dashboard-neo4j

# Rebuild dashboard from source
cd ~/Dashboard
docker compose up -d --build dashboard

# ZFS health
zpool status blackbox
zfs list -t snapshot | head

# nginx + DNS
sudo nginx -t && sudo systemctl reload nginx
nslookup ha.blackbox 127.0.0.1
```

### Backup checklist

- `~/Dashboard/.env` — secrets (not in git)
- Docker volumes: `homeassistant_config`, `n8n_data`, `jellyfin_config`, `portainer_data`, `neo4j_data`, `couchdb_data`
- `~/mosquitto/config/passwd`
- `~/govee2mqtt/govee.toml`
- `~/go2rtc/go2rtc.yaml`
- ZFS auto-snapshots already cover `/blackbox/*`

---

## License

The dashboard source is your own. Third-party components retain their upstream licenses (see Section 17).
