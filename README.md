# ⚡ TMA Server Controller (Telegram Mini App & Web Dashboard)

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React_18-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![NodeJS](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Telegram Mini App](https://img.shields.io/badge/Telegram-Mini_App-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://core.telegram.org/bots/webapps)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An ultra-modern, glassmorphic **Telegram Mini App (TMA)** and responsive Web Dashboard for managing Docker containers and monitoring Homelab server metrics effortlessly from your phone or desktop.

---

## ✨ Features

- 📱 **Native Telegram Mini App Experience**: Fully integrated with the Telegram WebApp SDK—including dynamic viewport adaptation, theme matching, safe-area insets, and **native Haptic Feedback** on button taps.
- 🎛️ **Full Docker Lifecycle Control**:
  - **Start**, **Stop**, **Restart**, **Pause**, and **Resume** containers with one tap.
  - **Delete** containers with optional force remove for stopped or stuck instances.
  - State-aware glowing badges and live status indicators.
- 📊 **Real-Time Homelab Metrics**:
  - **Server / CPU Temperature Tracker** with dynamic color threshold badges (`Optimal`, `Normal`, `Warm`, `Hot`).
  - Host RAM usage gauge with visual threshold warnings (Green/Amber/Rose).
  - CPU Cores and live Load Average metrics.
  - Host uptime and Docker engine version tracker.
  - Instant container breakdown (Total, Running, Stopped, Paused).
- 📜 **Interactive Terminal Log Viewer**:
  - Live log streaming with configurable tail depth (50, 100, 250, 500, 1000 lines).
  - Real-time in-log search/filter.
  - Timestamp toggle.
  - One-click copy to clipboard and `.txt` log file download.
- 🔍 **Deep Container Inspector**:
  - **Environment Variables**: Searchable key-value table with instant copy buttons.
  - **Networks & Ports**: View assigned container IPs, gateways, MAC addresses, and host port mappings.
  - **Mounts & Volumes**: Inspect attached volumes, bind mounts, and read/write permissions.
  - **Execution Details**: Command entrypoint, working directory, and restart policies.
- 🧹 **One-Click System Resource Prune**:
  - Clean up dangling images, stopped containers, and unused networks to reclaim disk space with a confirmation prompt.
- 🔄 **Smart Auto-Refresh**:
  - Switchable auto-sync (5s, 10s, 30s, or Off) without causing layout shift.
- 🎨 **Sleek Cyber-Homelab Dark UI**:
  - Glassmorphic panels, Inter & JetBrains Mono typography, skeleton loaders, and non-intrusive floating toast notifications.

---

## 🏗️ Architecture & Project Structure

```
tma-server-controller/
├── backend/
│   ├── Dockerfile             # Lightweight Node.js 20 Alpine image
│   ├── package.json           # Express, Dockerode, CORS dependencies
│   └── server.js              # RESTful API for Docker Socket & Host Metrics
├── frontend/
│   ├── Dockerfile             # Multi-stage build with Nginx Alpine
│   ├── nginx.conf             # Nginx reverse proxy configuration
│   ├── index.html             # HTML entry point with Telegram SDK
│   ├── package.json           # React 18, Vite 6, Lucide-React, TailwindCSS v4
│   ├── vite.config.js         # Vite configuration with @tailwindcss/vite plugin & proxy
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx         # Header with live pulse, auto-refresh, prune & Telegram user
│       │   ├── SystemStats.jsx    # RAM, CPU, Container count & Uptime overview
│       │   ├── ContainerCard.jsx  # Container card with quick controls & state styles
│       │   ├── LogModal.jsx       # Terminal log viewer with search, tail & export
│       │   ├── InspectModal.jsx   # Inspector for Env, Ports, Networks, Mounts
│       │   ├── ConfirmModal.jsx   # Confirmation modal for Stop, Delete, and Prune
│       │   ├── EmptyState.jsx     # Filter reset & empty daemon illustration
│       │   └── Toast.jsx          # Notification toast system
│       ├── utils/
│       │   └── telegram.js        # Telegram WebApp SDK helper functions & haptics
│       ├── App.jsx                # Main orchestration application
│       ├── index.css              # Custom glassmorphic CSS & scrollbars
│       └── main.jsx               # React DOM root entry
├── compose.yaml               # Docker Compose orchestration
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed on your server/homelab.
- Access to `/var/run/docker.sock` (Linux) or Docker Engine socket.

### 1. Clone & Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/Yuchnan/tma-server-controller.git
cd tma-server-controller

# Launch the containers
docker compose up -d --build
```

The services will be available at:
- **Web App / TMA Frontend**: `http://<YOUR-SERVER-IP>:3001`
- **Backend API**: `http://<YOUR-SERVER-IP>:4000` (also proxied through `http://<YOUR-SERVER-IP>:3001/api/`)

---

## 🤖 Configuring as a Telegram Mini App (TMA)

To use this controller inside Telegram:

1. **Expose your Frontend via HTTPS**:
   - Telegram WebApps require a valid `https://` URL.
   - You can use a Reverse Proxy (such as Nginx Proxy Manager, Caddy, or Traefik) with a domain name, or use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) / [ngrok](https://ngrok.com/).
   - *Example URL*: `https://docker.yourhomelab.com`

2. **Create or Configure your Telegram Bot**:
   - Open Telegram and search for [@BotFather](https://t.me/BotFather).
   - Create a new bot with `/newbot` or select your existing bot.
   - Send `/newapp` to register a Web App:
     1. Select your bot.
     2. Enter a title (e.g., `Homelab Controller`).
     3. Enter a short description.
     4. Upload a 640x360 image for preview.
     5. Provide your HTTPS URL (e.g., `https://docker.yourhomelab.com`).
     6. Choose a short name (e.g., `homelab`).
   - Alternatively, configure the Menu Button with `/setmenubutton` to launch the WebApp directly from the chat keyboard.

3. **Enjoy seamless homelab control from any device right inside Telegram!**

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/system/stats` | Get host CPU, RAM usage, load average, uptime, and Docker version |
| `GET` | `/api/containers` | List all containers with state, image, ports, and status |
| `GET` | `/api/containers/:id/inspect` | Detailed container inspection (env vars, networks, mounts) |
| `GET` | `/api/containers/:id/logs` | Fetch container logs (supports `?tail=100` and `?timestamps=true`) |
| `GET` | `/api/containers/:id/stats` | Container live stats snapshot (CPU %, Memory MB, Network I/O) |
| `POST` | `/api/containers/:id/start` | Start a stopped container |
| `POST` | `/api/containers/:id/stop` | Stop a running container |
| `POST` | `/api/containers/:id/restart` | Restart a container |
| `POST` | `/api/containers/:id/pause` | Pause a container |
| `POST` | `/api/containers/:id/unpause` | Resume a paused container |
| `DELETE` | `/api/containers/:id` | Remove a container (supports `?force=true`) |
| `POST` | `/api/system/prune` | Prune stopped containers, dangling images & unused networks |

---

## 🛠️ Local Development

### Running the Backend

```bash
cd backend
npm install
npm run dev
```

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will start at `http://localhost:3000` with automatic `/api` proxying to `http://localhost:4000`.

---

## 🔒 Security Note

> [!CAUTION]
> The backend connects to the Docker socket `/var/run/docker.sock`, which grants container management capabilities on the host. When exposing this dashboard over the public internet, ensure it is protected behind:
> - Telegram WebApp verification or a reverse proxy with authentication (e.g. Authelia, Cloudflare Access, Basic Auth).
> - A VPN / WireGuard / Tailscale network for private homelab access.

---

## 📄 License

MIT License. Crafted for homelab enthusiasts and Docker power users.
