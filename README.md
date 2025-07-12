# NEONVERSE: Real-Time Futuristic Chat Platform

NEONVERSE is a real-time chat platform with a unique, cyberpunk-inspired neon-glow UI. Built with Next.js (TypeScript), Tailwind CSS, and Socket.IO, it features advanced chat, media sharing, group management, and a visually striking, responsive design.

## Features
- Real-time messaging (Socket.IO): 1-1 and group chats, typing/online indicators, seen/delivered
- User authentication (NextAuth): email/password & Google, user profiles
- Media sharing: text, images, GIFs, voice notes (Cloudinary storage)
- Group chat features: custom groups, add/remove members, pinned messages, reactions
- Notifications: browser & sound alerts
- Search & filters: chats, messages, users, unread, pinned, recent
- Artistic UI: neon-glow, glassmorphism, dark mode, smooth animations, responsive

## Tech Stack
- **Frontend:** Next.js (TypeScript), Tailwind CSS
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB
- **Auth:** NextAuth
- **Storage:** Cloudinary

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
- `/src` — App source code
- `/app` — Next.js App Router
- `/components` — UI components
- `/styles` — Tailwind/global styles

---

> **Note:** This project is in early development. See the roadmap for upcoming features and design enhancements.
