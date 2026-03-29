# QuizBlast — Live Quiz Platform

A production-ready real-time web application similar to a live quiz platform, built with Node.js, Express, and Socket.IO.

## Features

- **Real-time player joining** — Players scan a QR code or enter a PIN on `/join`
- **Live player list** — Animated, instant updates as players join
- **Host control panel** — `/host` panel to manage and start the game
- **Synchronized countdown** — 10-second countdown visible on ALL connected devices
- **April Fools reveal** — Full-screen animated prank reveal after countdown
- **QR code generation** — Dynamic QR code linking to the join page
- **Modern UI** — Purple/blue gradient, smooth CSS animations, mobile-first

## Tech Stack

- **Node.js + Express** — HTTP server & static file serving
- **Socket.IO** — Real-time bi-directional communication
- **qrcode** — Server-side QR code generation
- **Vanilla JavaScript** — Zero client-side framework dependencies
- **CSS animations** — All animations use CSS for optimal performance

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open your browser at `http://localhost:3000`.

## Pages

| URL | Description |
|-----|-------------|
| `/` | Main game screen — shows PIN & QR code |
| `/join` | Mobile join page — enter PIN, nickname, avatar |
| `/host` | Host control panel — manage and start game |

## Deployment on Railway

1. Push this repository to GitHub
2. Go to [Railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select the repository
4. Railway automatically detects `npm start` and deploys

The app uses `process.env.PORT` — Railway sets this automatically.

### Environment Variables

No required environment variables. The app works out of the box.

## How to Play

1. Open the main screen at `/` — share the PIN or QR code with players
2. Players open `/join` on their phones and enter the PIN + nickname + avatar
3. Open `/host` to see all connected players
4. Click **Start Game** — a 10-second countdown syncs across all devices
5. After countdown: the April Fools reveal appears on all screens 😄

## Project Structure

```
server.js           — Express + Socket.IO server
package.json        — Dependencies
public/
  index.html        — Main screen (PIN, QR, player list)
  join.html         — Mobile join page
  host.html         — Host control panel
  style.css         — Global styles + animations
  client.js         — Shared Socket.IO client utilities
```

## License

MIT
