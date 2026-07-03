# Poll Night

A local-network voting and tasting event system built with React, Tailwind CSS v4, Vite, Fastify, and Socket.io.

## Prerequisites
- Node.js (v18+)

## Quick Start
To start both the frontend and backend servers, run the provided start script from the root of the project:

```bash
./start.sh
```

This script will start:
- **Backend**: on `http://localhost:3001` (WebSocket and API)
- **Frontend**: on `http://localhost:5173` (exposed to your local network)

## How to Test End-to-End

### 1. The Admin (Your Mac)
- **Admin Password**: The backend is protected via secure JWT Authentication. The password is `pollnight` (configurable in `backend/.env`).
- **Session Management**: From the Control Center, you can create new sessions or **Delete** existing ones using the red trash icon.
1. Open a browser on your Mac and go to `http://localhost:5173/admin`.
2. Enter the password `pollnight`.
3. Click **New Session** to create a test session (e.g., "Wine Tasting").
4. Click **Save and Start Event**. You are now in the Admin Dashboard for that session.
5. Click **Open Waiting Room** in the top right.
6. **Connect URL**: If you need to manually share the link, the dynamic connect URL is displayed at the bottom of the left sidebar.

### 2. The TV (Also your Mac)
1. In your Mac's browser, open a *new tab* and pull it out into its own window (pretend this is the TV connected via HDMI).
2. Go to `http://localhost:5173/tv/<SESSION_ID>` (you can find the session ID on the admin dashboard under the title).
3. You will see a massive QR Code. 

### 3. The Voter (Your Smartphone)
*Ensure your phone is connected to the same Wi-Fi network as your Mac.*
1. Open the camera app on your smartphone and scan the QR code on your "TV" tab.
2. Tap the link that appears. It will take you to the mobile login screen on your phone.
3. Enter your nickname and tap **Join Now**.

### 4. Running the Event
1. On the **Admin** tab, click **Start Event**.
2. Click **Open Voting** next to your first item. 
3. Watch the TV and your phone instantly light up with the new item!
4. Vote on your phone and press Submit. Watch your name pop forward in neon green on the TV grid!
5. On the **Admin** tab, click **Reveal** to show everyone the true brand of the item they just tasted.
6. Once you've voted on all items, click **End Event** on the Admin tab.
7. Look at the TV tab to watch the **Spectacular Animated 3D Podium** calculate the weighted scores and crown the winner!
