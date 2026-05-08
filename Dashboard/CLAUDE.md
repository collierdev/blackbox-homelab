# Pi Dashboard

A real-time web dashboard for monitoring and managing a Raspberry Pi 5 server.

## Quick Reference

| Item | Value |
|------|-------|
| Access URL | **http://blackbox/** (proxy) or http://192.168.50.39:8080 (direct) |
| Container Name | `pi-dashboard` |
| Port | 8080 (proxied through nginx on port 80) |
| Auto-restart | Yes (`--restart=always`) |
| Special Flags | `--pid=host --privileged` (required for host system access) |
| Reverse Proxy | ✅ nginx on port 80 with WebSocket support |

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
- `src/components/ChatBot.tsx` - Floating AI chat (Pi Agent/Ollama/Claude) with session management sidebar and LangGraph trace panel
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
- `src/routes/chat.ts` - POST /api/chat/ollama, /api/chat/claude, /api/chat/agent (SSE proxy to pi-agent); GET /api/chat/agent/health; POST /api/chat/agent/daily-brief
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
| `/api/chat/agent` | POST | SSE streaming proxy to pi-agent (no fixed timeout) |
| `/api/chat/agent/health` | GET | Pi Agent health probe (3 s timeout) |
| `/api/chat/agent/daily-brief` | POST | Trigger daily briefing generation (5 min timeout) |
| `/api/homeassistant/status` | GET | HA connection status |
| `/api/homeassistant/devices` | GET | List grouped HA devices |
| `/api/homeassistant/entities/:id/toggle` | POST | Toggle entity on/off |
| `/api/homeassistant/lights/:id/brightness` | POST | Set light brightness |
| `/api/homeassistant/climate/:id/temperature` | POST | Set thermostat temp |
| `/api/homeassistant/media_player/:id/:action` | POST | Media control (play_pause, next, etc.) |
| `/api/go2rtc/cameras` | GET | List all go2rtc cameras (5 cameras) |
| `/api/go2rtc/cameras/:id` | GET | Get single camera details |
| WebSocket `/socket.io` | - | Real-time stats + HA device updates |

## Reverse Proxy Setup

The Pi Dashboard is accessible through **nginx reverse proxy** with friendly DNS names:
- **Primary URL**: http://blackbox/ (via nginx on port 80)
- **Direct URL**: http://192.168.50.39:8080 (direct to container)

All services have friendly URLs powered by **dnsmasq** local DNS:
- Path-based: `http://blackbox/service` (Portainer)
- Subdomain: `http://service.blackbox` (Jellyfin, n8n, Plex, Home Assistant, go2rtc)

The container runs on port 8080 internally, proxied through nginx on port 80.

## Managed Services

The dashboard monitors and controls these services:

| Service | Type | Proxy URL | Direct URL |
|---------|------|-----------|------------|
| Jellyfin | Docker | http://jellyfin.blackbox | http://192.168.50.39:8096 |
| n8n | Docker | http://n8n.blackbox | http://192.168.50.39:5678 |
| Portainer | Docker | http://blackbox/portainer | https://192.168.50.39:9443 |
| Home Assistant | Docker | http://ha.blackbox | http://192.168.50.39:8123 |
| Plex | systemd | http://plex.blackbox | http://192.168.50.39:32400/web |
| go2rtc | systemd | http://go2rtc.blackbox | http://192.168.50.39:1984 |
| Ollama | systemd | - | http://localhost:11434 |
| pi-agent | systemd | http://agent.blackbox | http://192.168.50.39:8001 |
| nginx | systemd | - | Port 80 (reverse proxy) |
| Tailscale | systemd | - | - |
| Samba | systemd | `\\blackbox` | `\\192.168.50.39` |

To add a new service, edit `server/src/utils/docker.ts`:
- Add to `SERVICES_CONFIG` object with type, url, and port
- For systemd services, add to `systemdServices` array

## Pi Agent Integration

The dashboard connects to Pi Agent as its default AI chat provider. Pi Agent is a FastAPI + LangGraph service at `http://192.168.50.39:8001`, configured via the `AGENT_URL` environment variable.

### Provider Selection

| Option | Provider value | Backend endpoint |
|--------|---------------|-----------------|
| ★ Pi Agent (LangGraph) | `agent` | `/api/chat/agent` (SSE) |
| Ollama (Local) | `ollama` | `/api/chat/ollama` |
| Claude API | `claude` | `/api/chat/claude` |

`agent` is the default provider.

### Session Management

Sessions are persisted in `localStorage` under `pi_agent_sessions` (max 50). The `SessionSidebar` component shows running sessions and history grouped by provider and date, with per-session rename and delete.

### Trace Panel

When using Pi Agent, the `TracePanel` component visualises LangGraph execution steps emitted as `[TRACE]` lines. `[CANDIDATES]` JSON blocks show collapsible document/video retrieval results with an elapsed-time counter.

### SSE Protocol (agent stream)

| Token | Meaning |
|-------|---------|
| `[TRACE] <step>` | LangGraph node step |
| `[CANDIDATES] <json>` | Retrieved documents/videos |
| Plain text | Streamed answer tokens |
| `[DONE]` | End of stream |

The dashboard proxy at `/api/chat/agent` forwards the stream with client-disconnect abort; no fixed server-side timeout is applied.

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

## UI Components

### Shared Components

#### ColorPicker (`client/src/components/shared/ColorPicker.tsx`)

A comprehensive, reusable color picker component used throughout the dashboard for consistent color selection.

**Features:**
- **HSL Controls**: Hue (0-360°), Saturation (0-100%), Lightness (0-100%) sliders with live gradient backgrounds
- **Hex Input**: Direct hex code entry with real-time validation
- **RGB Inputs**: Optional detailed RGB controls (red, green, blue values)
- **Preset Swatches**: Configurable preset colors displayed in an 8x2 grid
- **Live Preview**: Large 64x64px color preview square with current hex code display
- **Custom Styling**: Beautiful slider thumbs with blue accents, shadows, and smooth hover effects
- **Dark Mode**: Full dark mode support with proper contrast

**Usage:**
```typescript
import ColorPicker from '../shared/ColorPicker';

<ColorPicker
  color="#EF4444"
  onChange={(hexColor) => handleColorChange(hexColor)}
  showPresets={true}
  presetColors={['#EF4444', '#F59E0B', '#3B82F6', ...]}
  label="Choose Color"
/>
```

**Props:**
- `color` - Current color value (hex string)
- `onChange` - Callback function when color changes
- `showPresets` - Whether to show preset color swatches (default: true)
- `presetColors` - Array of preset hex colors (optional)
- `label` - Label text for the color picker (optional)

**Used By:**
- Calendar Settings (project color customization)
- Smart Home light controls (via LightColorPicker adapter)
- Any component requiring color selection

#### LightColorPicker (`client/src/components/shared/LightColorPicker.tsx`)

Specialized adapter component for Home Assistant smart lights that wraps the ColorPicker component.

**Features:**
- RGB ↔ Hex color conversion for Home Assistant compatibility
- 16 lighting-optimized preset colors:
  - Warm whites (2700K-3000K tones)
  - Soft whites and daylight whites
  - Full spectrum of vibrant colors
  - Popular lighting scenes (electric purple, ocean blue, etc.)
- Integrates seamlessly with the main ColorPicker component
- Handles RGB value extraction for light control API calls

**Usage:**
```typescript
import LightColorPicker from '../shared/LightColorPicker';

<LightColorPicker
  rgb={[255, 100, 50]}
  onChange={([r, g, b]) => setLightColor(entityId, r, g, b)}
/>
```

### Calendar Components

#### CalendarSettings (`client/src/components/calendar/CalendarSettings.tsx`)

Comprehensive settings modal accessible via the Settings (⚙️) button in the calendar header.

**Features:**
- **Two-Tab Interface:**
  - **Calendar Sync Tab**: Connect/disconnect external calendar services
  - **Projects Tab**: Full CRUD operations for project management

**Calendar Sync Tab:**
- Display connected calendars with status badges (connected/error/syncing)
- Show last sync time and associated email address
- Disconnect calendar accounts with one click
- Support for multiple calendar providers:
  - Google Calendar (OAuth2)
  - Microsoft Outlook (Graph API)
  - Apple iCloud (CalDAV)
  - Generic CalDAV servers
- OAuth flow integration (UI ready, backend OAuth credentials required)

**Projects Tab:**
- Create new projects with custom names and colors
- Edit existing project names and colors inline
- Delete projects with confirmation dialog
- Integrated ColorPicker component for color selection
- 16 vibrant preset colors optimized for project organization
- Drag-and-drop reordering (planned)

**Access:**
Click the Settings (⚙️) button in the calendar header, then use the tab navigation to switch between "Calendar Sync" and "Projects".

#### CalendarHeader (`client/src/components/calendar/CalendarHeader.tsx`)

Modern calendar navigation and control header with enhanced visual design.

**Features:**
- **Gradient Background**: Subtle gradient from white to gray-50 (dark mode: gray-800 to gray-900)
- **Navigation Controls**:
  - Today button with pulse effect
  - Grouped Previous/Next month buttons with divider
  - Clear hover states with shadow enhancements
- **View Selector**: Buttons for Month/Week/Day/2-Month/Circular views
  - Blue active state with shadow-md
  - Scale animation on hover
- **Settings Button**: Gear icon (⚙️) to open CalendarSettings modal
- **Date Display**: Current month/year or date range display

### Smart Home Components

#### Light Color Control (`client/src/components/homeassistant/LightCard.tsx`)

Enhanced color control interface for Home Assistant lights with color-changing capabilities.

**Features:**
- Modern ColorPicker component (replaces old circular color wheel)
- 16 lighting-optimized preset colors for common scenes
- "Choose Color" button with enhanced styling (shadows, borders, hover states)
- Polished card interface with rounded corners and proper spacing
- Color picker opens in a container with shadow-lg and rounded-xl styling
- Seamless integration with Home Assistant REST API

**Usage:**
Color-capable lights display a "Choose Color" button below the brightness slider. Click to open the color picker and:
- Select from 16 preset lighting colors
- Use HSL sliders for precise color control
- Enter hex codes directly
- Use RGB inputs for advanced control

**Color Flow:**
1. User selects color in ColorPicker
2. LightColorPicker converts hex to RGB
3. RGB values sent to Home Assistant API
4. Light updates in real-time

### UI Modernization Features

#### Enhanced Button Styling
All interactive buttons throughout the dashboard now feature:
- **Shadows**: shadow-sm base, shadow-md on hover
- **Borders**: Subtle borders with hover state enhancements
- **Rounded Corners**: Consistent rounded-lg or rounded-xl
- **Hover Effects**: Smooth transitions with scale and shadow changes
- **Active States**: Blue accent (#3B82F6) with enhanced shadows

#### Custom Slider Styles (`client/src/index.css`)

Custom CSS styling for range input sliders used in the ColorPicker:

```css
input[type="range"].color-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 12px;
  border-radius: 6px;
  outline: none;
}

input[type="range"].color-slider::-webkit-slider-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid #3B82F6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

**Features:**
- Separate styling for WebKit (Chrome, Safari, Edge) and Mozilla (Firefox)
- 20px circular thumbs with blue borders
- Shadow effects for depth
- Hover animation (scale 1.1)
- Consistent appearance across browsers

#### View Toggles (Calendar/Tasks)

Modern toggle buttons in CalendarTodoView:
- Blue active state (replaces previous gray)
- Enhanced shadows (shadow-sm → shadow-md)
- Better contrast in both light and dark modes
- Consistent padding and rounded corners
- Smooth transitions on state changes

## Design System

### Color Palette
- **Primary Blue**: #3B82F6 (used for active states, accents, slider thumbs)
- **Accent Blue**: #2563EB (hover states)
- **Gray Scale**: Tailwind gray scale (50-900)
- **Project Colors**: 16 vibrant preset colors for visual organization

### Spacing
- **Component Gap**: 0.5rem to 1rem (8-16px)
- **Section Padding**: 0.75rem to 1rem (12-16px)
- **Container Padding**: 1rem to 1.5rem (16-24px)

### Border Radius
- **Small**: rounded-lg (0.5rem / 8px)
- **Medium**: rounded-xl (0.75rem / 12px)
- **Large**: rounded-2xl (1rem / 16px)

### Shadows
- **Base**: shadow-sm (subtle elevation)
- **Hover**: shadow-md (interactive feedback)
- **Container**: shadow-lg, shadow-xl (prominent elements)

### Typography
- System font stack with fallbacks
- Clear hierarchy using font-weight and size
- High contrast ratios (WCAG AA compliant)

## Accessibility

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Clear focus indicators with ring-2 ring-blue-500
- Tab order follows logical visual flow

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Enhanced contrast in dark mode
- Interactive elements have distinct hover/active states

### Touch Targets
- All buttons meet minimum 44x44px touch target size
- Adequate spacing between interactive elements
- Clear visual feedback on interaction
