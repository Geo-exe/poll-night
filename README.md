<div align="center">
  <h1>🍕 Poll Night</h1>
  <p><strong>A real-time, local-network voting and tasting event system.</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
  [![Fastify](https://img.shields.io/badge/Fastify-5-black)](https://www.fastify.io/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-green)](https://socket.io/)
</div>

<br />

**Poll Night** is a highly interactive, self-hosted web application designed to run perfect tasting events, blind taste tests, or any group voting competition. 

It splits the experience into three synchronized views:
- 👑 **Admin Panel:** Control the flow of the event, manage participants, and reveal results.
- 📺 **TV Display:** A gorgeous, animated big-screen view to show the current item, live participant voting status, a real-time chat, and the final animated podium.
- 📱 **Mobile App:** A friction-free mobile web app where participants scan a QR code on the TV, join the session, chat, and cast their votes.

![Poll Night Preview](https://via.placeholder.com/1200x600?text=Poll+Night+Preview+Screenshot)

## ✨ Features

- **Real-Time Syncing:** Everything is powered by WebSockets. The moment the admin opens voting, all TVs and mobile devices update instantly.
- **Blind Mode:** Hide the "real name" of the products you are tasting until the host decides to reveal them on the big screen!
- **Editable Sessions:** Add products, categories or photos right up until voting starts, without deleting and recreating the session.
- **Shared Attributes & Presets:** Reuse attribute sets (e.g. "Brand", "Cost", "Accessory") across products, or save your own presets.
- **Product Photos:** Upload a photo per item; it is stored as a file and referenced by URL, so it appears in the admin panel and on the TV during voting, review and the final podium.
- **Separate Image Uploads:** Product photos and participant avatars upload individually, without inflating the session save payload. Existing inline images are migrated automatically to `backend/uploads` on startup.
- **Dynamic Scoring:** Create custom categories (e.g., "Taste", "Texture", "Cost") with different weights and scales (1-5 or 1-10).
- **Editable Votes on Reopen:** Reopening a product starts a new voting round, preloads everyone's previous votes and lets participants correct them without creating duplicates.
- **Spectacular TV View:** Responsive `clamp()` typography, slick `animate-in` transitions, glassmorphism UI, real-time vote tracking, chat spotlights and a massive animated podium for the final results.
- **Recap Carousel:** The end-of-night recap never overflows: it rotates through vertical slides every 10 seconds, includes a dedicated vote-deviation chart (σ + distribution bars), and the admin can lock it on any slide for deeper analysis.
- **No-Overflow Voter Lists:** Voter avatars and rows scale down automatically, so the whole list always fits on screen; the chat keeps the newest messages and hides older ones.
- **Archived Sessions:** Ended sessions are kept in a dedicated archive. You can inspect the recap, open it on a TV, or reactivate the session without losing any data.

> Uploaded images live in `backend/uploads/`. Include that folder in backups together with `backend/poll-night.db`.
- **Frictionless Mobile Joining:** No app downloads. Just scan the QR code on the TV to jump straight into the live session.
- **Live Chat & Reactions:** Participants can banter and comment on the current item directly from their phones, and send quick reactions that float across the TV.

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS v4
- React Router
- Lucide Icons
- Socket.io-client

**Backend:**
- Node.js (v18+)
- Fastify (High-performance web framework)
- Socket.io (Real-time engine)
- SQLite3 (Zero-config local database)

## 🚀 Quick Start

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) installed on your machine.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/poll-night.git
cd poll-night
```

2. Install dependencies for both the frontend and backend:
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

3. Start the application:
```bash
# We provide a convenience script that starts both servers concurrently
./start.sh
```

This script will start:
- **Backend API & WebSocket Server:** `http://localhost:3001`
- **Frontend App:** `http://localhost:5173` (exposed to your local network automatically)

## 🎮 How to Run an Event

### 1. The Admin (Your Computer)
1. Go to `http://localhost:5173/admin`
2. Enter the default admin password: `pollnight` (you can change this in `backend/.env`).
3. Click **New Session** to configure your tasting event (categories, items, blind mode, etc).
4. Click **Save and Start Event** to jump into the control dashboard.
5. Click **Open Waiting Room**.

### 2. The TV (The Big Screen)
1. Hook your computer up to a TV via HDMI, or open a new browser window on your main monitor.
2. Go to `http://localhost:5173/tv/<SESSION_ID>` (The Session ID is visible at the top of your Admin panel).
3. The TV will display a massive QR Code for the waiting room.

### 3. The Voters (Smartphones)
1. Guests connect their phones to the same Wi-Fi network as your computer.
2. They scan the QR code on the TV using their phone's camera.
3. They enter a nickname, take a quick selfie for their avatar, and tap **Join Now**.

### 4. Let the Games Begin
1. On your Admin dashboard, click **Start Event**.
2. Click **Open Voting** next to the first item on the list. 
3. Watch the TV and mobile devices instantly sync to the new item!
4. Once everyone has voted, you can click **Reveal** to dramatically unveil the true identity of the product (if using Blind Mode).
5. When all items are completed, click **End Event** to calculate the weighted scores and trigger the grand animated podium!

## ⚙️ Configuration

You can customize the backend behavior by creating a `.env` file in the `/backend` directory:

```env
PORT=3001
ADMIN_PASSWORD=pollnight
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/yourusername/poll-night/issues) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
