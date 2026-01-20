# Pi Dashboard

A real-time web dashboard for monitoring and managing a Raspberry Pi 5 server.

## Quick Reference

| Item | Value |
|------|-------|
| Access URL | http://192.168.50.39 |
| Container Name | `pi-dashboard` |
| Port | 80 |
| Auto-restart | Yes (`--restart=always`) |
| Special Flags | `--pid=host --privileged` (required for host system access) |

## Architecture Overview

```
Dashboard/
├── client/          # React frontend (Vite + TypeScript + Tailwind)
├── server/          # Express.js backend (TypeScript)
├── Dockerfile       # Multi-stage build
├── docker-compose.yml
└── package.json     # Root scripts for dev/build
```

### Frontend (`client/`)

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 with dark/light mode
- **Icons**: Lucide React
- **Real-time**: Socket.io-client for live stats

Key components:
- `src/components/Header.tsx` - Top bar with hostname, connection status, theme toggle
- `src/components/SystemStats.tsx` - CPU, RAM, disk, temp, network displays + collapsible tables
- `src/components/Services.tsx` - Service cards with start/stop/restart
- `src/components/ServiceCard.tsx` - Individual service control card
- `src/components/ChatBot.tsx` - Floating AI chat (Ollama/Claude)
- `src/components/HomeAssistant.tsx` - Smart home device control panel
- `src/components/homeassistant/*.tsx` - Device-specific cards (Light, Switch, Climate, MediaPlayer)
- `src/components/go2rtc/*.tsx` - Security camera components (CamerasSection, Go2RTCCameraCard)
- `src/context/ThemeContext.tsx` - Dark/light mode state
- `src/hooks/useSocket.ts` - WebSocket connection for real-time stats + Home Assistant API

**UI Features:**
- **Tab Navigation** - System (dashboard) and Smart Home tabs
- **Network Services Table** - Collapsible table showing all services with IPs, ports, and clickable URLs
- **Memory Usage Table** - Collapsible, sortable table showing top processes by memory usage
- **Home Assistant Integration** - Device control cards for lights, switches, climate, and media players
- **Security Cameras** - 5 cameras via go2rtc integration with WebRTC/MSE/HLS streaming, HD/SD quality, and fullscreen support

### Backend (`server/`)

- **Framework**: Express 5 + TypeScript
- **Real-time**: Socket.io for pushing stats every 2 seconds
- **System Info**: `systeminformation` package
- **Docker**: `dockerode` package for container management

Key files:
- `src/index.ts` - Main server, WebSocket setup, static file serving
- `src/routes/system.ts` - GET /api/system/stats, /api/system/cpu-history
- `src/routes/services.ts` - GET/POST /api/services for Docker/systemd control
- `src/routes/chat.ts` - POST /api/chat/ollama, /api/chat/claude
- `src/routes/homeassistant.ts` - Home Assistant REST endpoints
- `src/routes/go2rtc.ts` - go2rtc camera API endpoints
- `src/utils/systemInfo.ts` - CPU, RAM, temp, disk, network data collection
- `src/utils/docker.ts` - Docker container and systemd service management
- `src/utils/homeassistant.ts` - Home Assistant API client
- `src/config/homeassistant.ts` - HA URL and token configuration
- `src/config/go2rtc.ts` - go2rtc camera configuration (5 cameras)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/system/stats` | GET | Current system stats |
| `/api/system/cpu-history` | GET | Per-core CPU usage |
| `/api/services` | GET | List all services |
| `/api/services/:id/:action` | POST | Control service (start/stop/restart) |
| `/api/chat/models` | GET | List Ollama models |
| `/api/chat/ollama` | POST | Chat with local Ollama |
| `/api/chat/claude` | POST | Chat with Claude API |
| `/api/homeassistant/status` | GET | HA connection status |
| `/api/homeassistant/devices` | GET | List grouped HA devices |
| `/api/homeassistant/entities/:id/toggle` | POST | Toggle entity on/off |
| `/api/homeassistant/lights/:id/brightness` | POST | Set light brightness |
| `/api/homeassistant/climate/:id/temperature` | POST | Set thermostat temp |
| `/api/homeassistant/media_player/:id/:action` | POST | Media control (play_pause, next, etc.) |
| `/api/go2rtc/cameras` | GET | List all go2rtc cameras (5 cameras) |
| `/api/go2rtc/cameras/:id` | GET | Get single camera details |
| WebSocket `/socket.io` | - | Real-time stats + HA device updates |

## Managed Services

The dashboard monitors and controls these services:

| Service | Type | Default URL |
|---------|------|-------------|
| Jellyfin | Docker | http://192.168.50.39:8096 |
| n8n | Docker | http://192.168.50.39:5678 |
| Portainer | Docker | https://192.168.50.39:9443 |
| Home Assistant | Docker | http://192.168.50.39:8123 |
| Plex | systemd | http://192.168.50.39:32400/web |
| Ollama | systemd | http://localhost:11434 |
| Tailscale | systemd | - |
| Samba | systemd | `\\192.168.50.39` (Windows file sharing) |

To add a new service, edit `server/src/utils/docker.ts`:
- Add to `SERVICES_CONFIG` object with type, url, and port
- For systemd services, add to `systemdServices` array

## Common Tasks

### View container logs
```bash
sudo docker logs pi-dashboard
sudo docker logs -f pi-dashboard  # Follow
```

### Restart the dashboard
```bash
sudo docker restart pi-dashboard
```

### Rebuild and redeploy
```bash
cd ~/Dashboard
sudo docker stop pi-dashboard && sudo docker rm pi-dashboard
docker build -t pi-dashboard .
sudo docker run -d --name pi-dashboard --restart=always \
  -p 80:80 \
  --pid=host \
  --privileged \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  pi-dashboard
```

**Important flags:**
- `--pid=host` - Share host's PID namespace (required for `nsenter` to access host processes)
- `--privileged` - Required for `nsenter` to work properly
- `-v /var/run/docker.sock:/var/run/docker.sock:ro` - Access Docker API for container management

### Development mode
```bash
cd ~/Dashboard
npm run dev  # Runs both client (5173) and server (3001)
```

### Build only (no Docker)
```bash
cd ~/Dashboard
npm run build
PORT=80 npm start  # Requires sudo for port 80
```

## Updating the Dashboard

### Adding a new stat/metric

1. Add data collection in `server/src/utils/systemInfo.ts`
2. Update the `SystemStats` interface in both:
   - `server/src/utils/systemInfo.ts`
   - `client/src/types/index.ts`
3. Create/update component in `client/src/components/`

### Adding a new service

1. Edit `server/src/utils/docker.ts`:
   ```typescript
   const SERVICES_CONFIG = {
     // Add new entry:
     myservice: { type: 'docker', url: 'http://...', port: 8080 },
   };
   ```
2. For systemd services, also add to `systemdServices` array

### Changing theme colors

Edit `client/src/index.css` - CSS variables in `:root` (light) and `.dark` sections.

### Changing real-time update interval

Edit `server/src/index.ts` - change `2000` in `setInterval()` (line ~47).

## Troubleshooting

### Dashboard won't start
```bash
sudo docker logs pi-dashboard
# Check for errors in output
```

### Can't control Docker containers
Ensure the Docker socket is mounted:
```bash
sudo docker inspect pi-dashboard | grep -A5 Mounts
# Should show /var/run/docker.sock
```

### Can't control systemd services
The container needs sudo access for systemd. For now, systemd control runs via `sudo systemctl` which may require passwordless sudo setup.

### Port 80 already in use
```bash
sudo lsof -i :80
# Stop the conflicting service, then restart pi-dashboard
```

## Tech Stack Summary

- **Frontend**: React 18, Vite 7, TypeScript, Tailwind CSS 4, Socket.io-client, Lucide icons
- **Backend**: Node.js 22, Express 5, TypeScript, Socket.io, systeminformation, dockerode
- **Container**: Docker with multi-stage build, auto-restart policy
- **AI Chat**: Ollama (local) or Claude API (requires key)
- **Smart Home**: Home Assistant REST API integration

## Home Assistant Integration

The dashboard integrates with Home Assistant for smart home device control.

### Configuration

Home Assistant connection is configured in `server/src/config/homeassistant.ts`:
- **URL**: `http://192.168.50.39:8123` (or via `HA_URL` env var)
- **Token**: Long-lived access token (or via `HA_TOKEN` env var)

To generate a new token: Home Assistant > Profile > Security > Long-Lived Access Tokens

### Supported Device Types

| Device Type | Controls |
|-------------|----------|
| Lights | On/off toggle, brightness slider |
| Switches | On/off toggle |
| Climate | Temperature adjustment (+/-), HVAC mode |
| Media Players | Play/pause, skip, volume slider |

### Frontend Components

- `HomeAssistant.tsx` - Main container with collapsed summary and full views
- `LightCard.tsx` - Light toggle with brightness control
- `SwitchCard.tsx` - Simple on/off switch control
- `ClimateCard.tsx` - Thermostat with temperature adjustment
- `MediaPlayerCard.tsx` - Media controls with volume slider

### Real-time Updates

Device states are pushed via Socket.io every 5 seconds:
- `haStatus` event - Connection status
- `haDevices` event - Grouped device states (lights, switches, climate, media_players)

## Security Cameras (go2rtc Integration)

The dashboard integrates with go2rtc for security camera streaming. go2rtc provides RTSP to WebRTC/MSE/HLS conversion for low-latency camera viewing.

### Configuration

Camera configuration is in `server/src/config/go2rtc.ts`:
- **go2rtc URL**: `http://192.168.50.39:1984` (or via `GO2RTC_URL` env var)
- **5 Cameras Configured**:
  - Camera 1: 192.168.50.242
  - Camera 2: 192.168.50.246
  - Camera 3: 192.168.50.227
  - Camera 4: 192.168.50.73
  - Camera 5: 192.168.50.114

Each camera has HD and SD stream variants configured in go2rtc.

### Frontend Components

- `CamerasSection.tsx` - Main camera grid container with expand/collapse
- `Go2RTCCameraCard.tsx` - Individual camera card with streaming controls

### Camera Features

- **Streaming Modes**: WebRTC (low latency), MSE, HLS, MJPEG
- **Quality Selection**: HD and SD streams for each camera
- **Fullscreen Support** - Click maximize button to view camera in fullscreen
- **Custom Naming** - Double-click camera name to rename (persists in localStorage)
- **Status Display** - Shows online/offline status and stream availability
- **Playbar Controls** - Hover over camera to show play/pause, quality selector, settings
- **Error Handling** - Graceful fallback with retry option when feed fails
- **iframe Integration** - Uses go2rtc's iframe-friendly pages for seamless embedding

Camera streams are served directly from go2rtc (no backend proxying needed).
