# Software Suggestions for Your Raspberry Pi 5

**Last Updated**: January 12, 2026 00:57 EST

> **Note**: This file is maintained by Claude Code. Move items to "Already Installed" section and update INSTALLATION_REPORT.md when software is installed.

Based on your current setup, here are software recommendations that complement your system.

---

## Already Installed (from suggestions)

| Software | Version | Status | Installed |
|----------|---------|--------|-----------|
| Portainer | Latest (CE) | Running | Jan 12, 2026 |
| Tailscale | 1.92.5 | Running | Jan 12, 2026 |
| tmux | 3.5a | Installed | Jan 12, 2026 |
| fail2ban | 1.1.0 | Running | Jan 12, 2026 |
| neovim | 0.10.4 | Installed | Jan 12, 2026 |
| Node.js | 24.12.0 | Installed | Jan 12, 2026 |

---

## High Priority - Strongly Recommended

### 1. Home Assistant (Smart Home Automation)
**What it does**: Central hub for smart home devices
**Why you need it**: Integrates beautifully with n8n for advanced automations
```bash
sudo docker run -d --name homeassistant --restart=unless-stopped \
  -v /home/jwcollie/homeassistant:/config \
  -e TZ=America/New_York \
  --network=host homeassistant/home-assistant:stable
```
**Access**: http://192.168.50.39:8123

### 2. Open WebUI (Ollama Frontend)
**What it does**: ChatGPT-like interface for Ollama
**Why you need it**: Much better than CLI for chatting with local AI models
```bash
sudo docker run -d -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  --name open-webui --restart always \
  ghcr.io/open-webui/open-webui:main
```
**Access**: http://192.168.50.39:3000

### 3. Nginx Proxy Manager (Reverse Proxy)
**What it does**: Easy reverse proxy with SSL certificates
**Why you need it**: Access all services with nice URLs (e.g., plex.home.local) and automatic HTTPS
```bash
sudo docker run -d --name nginx-proxy-manager \
  -p 80:80 -p 443:443 -p 81:81 \
  -v /home/jwcollie/nginx-proxy-manager/data:/data \
  -v /home/jwcollie/nginx-proxy-manager/letsencrypt:/etc/letsencrypt \
  --restart unless-stopped jc21/nginx-proxy-manager:latest
```
**Access**: http://192.168.50.39:81 (default: admin@example.com / changeme)

### 4. Uptime Kuma (Monitoring)
**What it does**: Beautiful uptime monitoring for all your services
**Why you need it**: Get alerts when services go down, track uptime history
```bash
sudo docker run -d --name uptime-kuma -p 3001:3001 \
  -v /home/jwcollie/uptime-kuma:/app/data \
  --restart unless-stopped louislam/uptime-kuma:1
```
**Access**: http://192.168.50.39:3001

---

## Self-Hosted Cloud Alternatives

### 5. Nextcloud (Google Drive/Dropbox Alternative)
**What it does**: Full cloud storage, calendar, contacts, office docs
**Why you need it**: Own your data instead of paying for cloud storage
```bash
sudo docker run -d --name nextcloud -p 8080:80 \
  -v /home/jwcollie/nextcloud:/var/www/html \
  --restart unless-stopped nextcloud:latest
```
**Access**: http://192.168.50.39:8080

### 6. Immich (Google Photos Alternative)
**What it does**: Self-hosted photo/video backup with AI features
**Why you need it**: Beautiful photo management, facial recognition, mobile app backup
```bash
# Requires docker-compose - create /home/jwcollie/immich/docker-compose.yml
# See: https://immich.app/docs/install/docker-compose
mkdir -p /home/jwcollie/immich && cd /home/jwcollie/immich
wget https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
wget -O .env https://github.com/immich-app/immich/releases/latest/download/example.env
sudo docker compose up -d
```
**Access**: http://192.168.50.39:2283

### 7. Vaultwarden (Bitwarden Password Manager)
**What it does**: Self-hosted password manager compatible with Bitwarden apps
**Why you need it**: Secure password management without subscription fees
```bash
sudo docker run -d --name vaultwarden -p 8222:80 \
  -v /home/jwcollie/vaultwarden:/data \
  -e SIGNUPS_ALLOWED=true \
  --restart unless-stopped vaultwarden/server:latest
```
**Access**: http://192.168.50.39:8222

### 8. Paperless-ngx (Document Management)
**What it does**: Scan, index, and archive all your paper documents
**Why you need it**: Go paperless - OCR, full-text search, auto-tagging
```bash
sudo docker run -d --name paperless-ngx -p 8000:8000 \
  -v /home/jwcollie/paperless/data:/usr/src/paperless/data \
  -v /home/jwcollie/paperless/media:/usr/src/paperless/media \
  -v /home/jwcollie/paperless/consume:/usr/src/paperless/consume \
  -e PAPERLESS_URL=http://192.168.50.39:8000 \
  --restart unless-stopped ghcr.io/paperless-ngx/paperless-ngx:latest
```
**Access**: http://192.168.50.39:8000

### 9. Mealie (Recipe Manager)
**What it does**: Self-hosted recipe management with meal planning
**Why you need it**: Import recipes from any URL, meal planning, shopping lists
```bash
sudo docker run -d --name mealie -p 9925:9000 \
  -v /home/jwcollie/mealie:/app/data \
  -e ALLOW_SIGNUP=true \
  -e TZ=America/New_York \
  --restart unless-stopped ghcr.io/mealie-recipes/mealie:latest
```
**Access**: http://192.168.50.39:9925

---

## Development Tools

### 10. Gitea (Self-hosted Git)
**What it does**: Lightweight GitHub alternative
**Why you need it**: Host your own git repositories privately
```bash
sudo docker run -d --name gitea -p 3002:3000 -p 2222:22 \
  -v /home/jwcollie/gitea:/data \
  -e USER_UID=1000 -e USER_GID=1000 \
  --restart unless-stopped gitea/gitea:latest
```
**Access**: http://192.168.50.39:3002

### 13. Code-server (VS Code in Browser)
**What it does**: Run VS Code in your browser from anywhere
**Why you need it**: Code on your Pi from any device with a browser
```bash
sudo docker run -d --name code-server -p 8443:8443 \
  -v /home/jwcollie:/home/coder \
  -e PASSWORD=yourpassword \
  --restart unless-stopped linuxserver/code-server:latest
```
**Access**: http://192.168.50.39:8443

### 14. PostgreSQL (Database)
**What it does**: Powerful relational database
**Why you need it**: Many self-hosted apps work better with PostgreSQL
```bash
sudo docker run -d --name postgres -p 5432:5432 \
  -v /home/jwcollie/postgres:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=yourpassword \
  --restart unless-stopped postgres:16-alpine
```

### 15. Redis (Cache/Message Broker)
**What it does**: In-memory data store
**Why you need it**: Speeds up many applications, required by some services
```bash
sudo docker run -d --name redis -p 6379:6379 \
  -v /home/jwcollie/redis:/data \
  --restart unless-stopped redis:alpine
```

### 16. Adminer (Database GUI)
**What it does**: Web-based database management
**Why you need it**: Manage PostgreSQL, MySQL, SQLite from browser
```bash
sudo docker run -d --name adminer -p 8081:8080 \
  --restart unless-stopped adminer:latest
```
**Access**: http://192.168.50.39:8081

---

## Media & Content - Complements Plex

### 17. Sonarr (TV Show Management)
**What it does**: Automatic TV show downloading and organization
**Why you need it**: Automates adding content to your Plex library
```bash
sudo docker run -d --name sonarr -p 8989:8989 \
  -v /home/jwcollie/sonarr:/config \
  -v /path/to/tv:/tv \
  -v /path/to/downloads:/downloads \
  --restart unless-stopped linuxserver/sonarr
```
**Access**: http://192.168.50.39:8989

### 18. Radarr (Movie Management)
**What it does**: Automatic movie downloading and organization
**Why you need it**: Same as Sonarr but for movies
```bash
sudo docker run -d --name radarr -p 7878:7878 \
  -v /home/jwcollie/radarr:/config \
  -v /path/to/movies:/movies \
  -v /path/to/downloads:/downloads \
  --restart unless-stopped linuxserver/radarr
```
**Access**: http://192.168.50.39:7878

### 19. Prowlarr (Indexer Manager)
**What it does**: Manage indexers for Sonarr/Radarr in one place
**Why you need it**: Centralizes indexer management, syncs to all *arr apps
```bash
sudo docker run -d --name prowlarr -p 9696:9696 \
  -v /home/jwcollie/prowlarr:/config \
  --restart unless-stopped linuxserver/prowlarr
```
**Access**: http://192.168.50.39:9696

### 20. Bazarr (Subtitles)
**What it does**: Automatic subtitle downloading
**Why you need it**: Automatically fetches subtitles for all your media
```bash
sudo docker run -d --name bazarr -p 6767:6767 \
  -v /home/jwcollie/bazarr:/config \
  -v /path/to/movies:/movies \
  -v /path/to/tv:/tv \
  --restart unless-stopped linuxserver/bazarr
```
**Access**: http://192.168.50.39:6767

### 21. Overseerr (Media Requests)
**What it does**: Beautiful request management for Plex
**Why you need it**: Let family members request movies/shows
```bash
sudo docker run -d --name overseerr -p 5055:5055 \
  -v /home/jwcollie/overseerr:/app/config \
  --restart unless-stopped sctx/overseerr
```
**Access**: http://192.168.50.39:5055

### 22. Tautulli (Plex Monitoring)
**What it does**: Monitor Plex usage and statistics
**Why you need it**: See who's watching what, history, notifications
```bash
sudo docker run -d --name tautulli -p 8181:8181 \
  -v /home/jwcollie/tautulli:/config \
  --restart unless-stopped linuxserver/tautulli
```
**Access**: http://192.168.50.39:8181

### 23. qBittorrent (Download Client)
**What it does**: Torrent client with web interface
**Why you need it**: Download client for Sonarr/Radarr
```bash
sudo docker run -d --name qbittorrent -p 8090:8080 -p 6881:6881 \
  -v /home/jwcollie/qbittorrent:/config \
  -v /path/to/downloads:/downloads \
  -e WEBUI_PORT=8080 \
  --restart unless-stopped linuxserver/qbittorrent
```
**Access**: http://192.168.50.39:8090 (default: admin / adminadmin)

---

## AI & Machine Learning

### 24. LocalAI (OpenAI-compatible API)
**What it does**: Drop-in OpenAI API replacement using local models
**Why you need it**: Use any app that supports OpenAI API with local models
```bash
sudo docker run -d --name localai -p 8085:8080 \
  -v /home/jwcollie/localai/models:/models \
  --restart unless-stopped localai/localai:latest
```
**Access**: http://192.168.50.39:8085

### 25. Whisper (Speech-to-Text)
**What it does**: OpenAI's Whisper for transcription
**Why you need it**: Transcribe audio/video to text locally
```bash
sudo docker run -d --name whisper -p 9000:9000 \
  -v /home/jwcollie/whisper:/app/uploads \
  --restart unless-stopped onerahmet/openai-whisper-asr-webservice:latest
```
**Access**: http://192.168.50.39:9000

---

## System Monitoring & Security

### 26. Netdata (Real-time Monitoring)
**What it does**: Beautiful real-time system monitoring dashboard
**Why you need it**: Monitor CPU, RAM, disk, network, Docker containers
```bash
wget -O /tmp/netdata-kickstart.sh https://get.netdata.cloud/kickstart.sh && sh /tmp/netdata-kickstart.sh
```
**Access**: http://192.168.50.39:19999

### 27. Pi-hole (Network-wide Ad Blocking)
**What it does**: DNS-level ad blocking for your entire network
**Why you need it**: Blocks ads on all devices, improves network performance
```bash
curl -sSL https://install.pi-hole.net | bash
```
**Access**: http://192.168.50.39/admin

### 28. Dozzle (Docker Log Viewer)
**What it does**: Real-time Docker container log viewer
**Why you need it**: Easy way to view logs from all containers in browser
```bash
sudo docker run -d --name dozzle -p 9999:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart unless-stopped amir20/dozzle:latest
```
**Access**: http://192.168.50.39:9999

### 29. Watchtower (Auto-update Containers)
**What it does**: Automatically updates Docker containers
**Why you need it**: Keep all containers up-to-date without manual intervention
```bash
sudo docker run -d --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart unless-stopped containrrr/watchtower \
  --cleanup --schedule "0 0 4 * * *"
```
**Note**: Runs daily at 4 AM, cleans up old images

### 30. CrowdSec (Modern Fail2ban)
**What it does**: Collaborative security engine
**Why you need it**: Better than fail2ban - shares threat intel with community
```bash
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec-firewall-bouncer-iptables
```

---

## Dashboards & Organization

### 31. Homepage (Dashboard)
**What it does**: Modern, customizable dashboard for all your services
**Why you need it**: One page to access everything with live stats
```bash
sudo docker run -d --name homepage -p 3003:3000 \
  -v /home/jwcollie/homepage:/app/config \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --restart unless-stopped ghcr.io/gethomepage/homepage:latest
```
**Access**: http://192.168.50.39:3003

### 32. Homarr (Dashboard Alternative)
**What it does**: Sleek dashboard with drag-and-drop
**Why you need it**: Easy to configure, integrates with many services
```bash
sudo docker run -d --name homarr -p 7575:7575 \
  -v /home/jwcollie/homarr/configs:/app/data/configs \
  -v /home/jwcollie/homarr/icons:/app/public/icons \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart unless-stopped ghcr.io/ajnart/homarr:latest
```
**Access**: http://192.168.50.39:7575

### 33. Bookstack (Wiki/Documentation)
**What it does**: Self-hosted wiki for documentation
**Why you need it**: Document your setup, notes, procedures
```bash
sudo docker run -d --name bookstack -p 6875:80 \
  -v /home/jwcollie/bookstack:/config \
  -e APP_URL=http://192.168.50.39:6875 \
  -e DB_HOST=localhost -e DB_DATABASE=bookstack \
  --restart unless-stopped linuxserver/bookstack
```
**Access**: http://192.168.50.39:6875

### 34. Linkding (Bookmark Manager)
**What it does**: Self-hosted bookmark manager
**Why you need it**: Save and organize bookmarks, searchable archive
```bash
sudo docker run -d --name linkding -p 9090:9090 \
  -v /home/jwcollie/linkding:/etc/linkding/data \
  --restart unless-stopped sissbruecker/linkding:latest
```
**Access**: http://192.168.50.39:9090

---

## Communication & Notifications

### 35. Gotify (Push Notifications)
**What it does**: Self-hosted push notification server
**Why you need it**: Get notifications from n8n, scripts, and services
```bash
sudo docker run -d --name gotify -p 8070:80 \
  -v /home/jwcollie/gotify:/app/data \
  --restart unless-stopped gotify/server:latest
```
**Access**: http://192.168.50.39:8070

### 36. Ntfy (Push Notifications Alternative)
**What it does**: Simple HTTP-based pub-sub notifications
**Why you need it**: Dead simple - just curl to send notifications
```bash
sudo docker run -d --name ntfy -p 8071:80 \
  -v /home/jwcollie/ntfy:/var/lib/ntfy \
  --restart unless-stopped binwiederhier/ntfy
```
**Access**: http://192.168.50.39:8071

---

## Backup & Storage

### 37. Syncthing (File Synchronization)
**What it does**: Continuous file sync between devices
**Why you need it**: Keep files in sync across your computers
```bash
sudo docker run -d --name syncthing -p 8384:8384 -p 22000:22000 \
  -v /home/jwcollie/syncthing:/var/syncthing \
  --restart unless-stopped syncthing/syncthing
```
**Access**: http://192.168.50.39:8384

### 38. Duplicati (Backup Solution)
**What it does**: Encrypted backups to cloud storage
**Why you need it**: Backup your Pi's important data
```bash
sudo docker run -d --name duplicati -p 8200:8200 \
  -v /home/jwcollie/duplicati:/data \
  -v /home/jwcollie:/source \
  --restart unless-stopped linuxserver/duplicati
```
**Access**: http://192.168.50.39:8200

### 39. FileBrowser (Web File Manager)
**What it does**: Web-based file manager
**Why you need it**: Browse and manage files from any browser
```bash
sudo docker run -d --name filebrowser -p 8082:80 \
  -v /home/jwcollie:/srv \
  -v /home/jwcollie/filebrowser/database.db:/database.db \
  --restart unless-stopped filebrowser/filebrowser
```
**Access**: http://192.168.50.39:8082 (default: admin / admin)

### 40. MinIO (S3-compatible Storage)
**What it does**: Self-hosted object storage (S3 API compatible)
**Why you need it**: Use S3 APIs locally, great for backups and apps
```bash
sudo docker run -d --name minio -p 9002:9000 -p 9001:9001 \
  -v /home/jwcollie/minio:/data \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=changeme123 \
  --restart unless-stopped minio/minio server /data --console-address ":9001"
```
**Access**: http://192.168.50.39:9001 (console)

---

## Entertainment & Gaming

### 41. Minecraft Server
**What it does**: Host your own Minecraft server
**Why you need it**: Play Minecraft with friends on your own server
```bash
sudo docker run -d --name minecraft -p 25565:25565 \
  -v /home/jwcollie/minecraft:/data \
  -e EULA=TRUE -e TYPE=PAPER \
  -e MEMORY=2G \
  --restart unless-stopped itzg/minecraft-server
```

### 42. Audiobookshelf (Audiobook Server)
**What it does**: Self-hosted audiobook and podcast server
**Why you need it**: Like Plex but specifically for audiobooks
```bash
sudo docker run -d --name audiobookshelf -p 13378:80 \
  -v /home/jwcollie/audiobookshelf/config:/config \
  -v /home/jwcollie/audiobookshelf/metadata:/metadata \
  -v /path/to/audiobooks:/audiobooks \
  --restart unless-stopped ghcr.io/advplyr/audiobookshelf:latest
```
**Access**: http://192.168.50.39:13378

### 43. Navidrome (Music Server)
**What it does**: Modern music server with Subsonic API
**Why you need it**: Stream your music collection, works with many apps
```bash
sudo docker run -d --name navidrome -p 4533:4533 \
  -v /home/jwcollie/navidrome:/data \
  -v /path/to/music:/music:ro \
  --restart unless-stopped deluan/navidrome
```
**Access**: http://192.168.50.39:4533

---

## Utilities

### 44. IT-Tools (Developer Utilities)
**What it does**: Collection of useful developer tools in browser
**Why you need it**: JSON formatter, hash generators, encoders, converters
```bash
sudo docker run -d --name it-tools -p 8083:80 \
  --restart unless-stopped corentinth/it-tools:latest
```
**Access**: http://192.168.50.39:8083

### 45. Stirling-PDF (PDF Tools)
**What it does**: All-in-one PDF manipulation tool
**Why you need it**: Merge, split, convert, OCR PDFs in browser
```bash
sudo docker run -d --name stirling-pdf -p 8084:8080 \
  -v /home/jwcollie/stirling-pdf:/usr/share/tessdata \
  --restart unless-stopped frooodle/s-pdf:latest
```
**Access**: http://192.168.50.39:8084

### 46. Speedtest Tracker (Internet Speed Monitoring)
**What it does**: Automated internet speed testing with history
**Why you need it**: Track your ISP's performance over time
```bash
sudo docker run -d --name speedtest-tracker -p 8765:80 \
  -v /home/jwcollie/speedtest-tracker:/config \
  -e PUID=1000 -e PGID=1000 \
  --restart unless-stopped linuxserver/speedtest-tracker
```
**Access**: http://192.168.50.39:8765

### 47. changedetection.io (Website Change Monitor)
**What it does**: Monitor websites for changes
**Why you need it**: Get notified when prices drop, pages update, etc.
```bash
sudo docker run -d --name changedetection -p 5000:5000 \
  -v /home/jwcollie/changedetection:/datastore \
  --restart unless-stopped ghcr.io/dgtlmoon/changedetection.io
```
**Access**: http://192.168.50.39:5000

---

## Port Reference (if all installed)

| Port | Service |
|------|---------|
| 80/443 | Nginx Proxy Manager |
| 81 | Nginx Proxy Manager Admin |
| 3000 | Open WebUI |
| 3001 | Uptime Kuma |
| 3002 | Gitea |
| 3003 | Homepage |
| 4533 | Navidrome |
| 5000 | changedetection.io |
| 5055 | Overseerr |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 6767 | Bazarr |
| 6875 | Bookstack |
| 7575 | Homarr |
| 7878 | Radarr |
| 8000 | Paperless-ngx |
| 8070 | Gotify |
| 8080 | Nextcloud |
| 8081 | Adminer |
| 8082 | FileBrowser |
| 8083 | IT-Tools |
| 8084 | Stirling-PDF |
| 8085 | LocalAI |
| 8090 | qBittorrent |
| 8123 | Home Assistant |
| 8181 | Tautulli |
| 8200 | Duplicati |
| 8222 | Vaultwarden |
| 8384 | Syncthing |
| 8443 | Code-server |
| 8765 | Speedtest Tracker |
| 8989 | Sonarr |
| 9000 | Whisper |
| 9001 | MinIO Console |
| 9090 | Linkding |
| 9696 | Prowlarr |
| 9925 | Mealie |
| 9999 | Dozzle |
| 13378 | Audiobookshelf |
| 25565 | Minecraft |

---

## Notes

- All Docker commands use `--restart` flags for auto-start on boot
- Adjust volume paths (`/path/to/...`) to match your actual media locations
- Consider storage requirements before installing media management tools
- Many services require initial setup (create admin accounts)
- Use Nginx Proxy Manager to give services nice domain names
- Consider memory limits for Pi 5 (8GB) - don't run everything at once
