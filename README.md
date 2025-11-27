# 🚀 AccessCode IDE

**A fully accessible, AI-powered web-based IDE for visually impaired & dyslexic learners.**  
Built with **React, Vite, TypeScript, TailwindCSS, shadcn-ui, Monaco Editor, FastAPI**, and the **Piston** execution engine.

---

## 🌟 Overview

**AccessCode IDE** is an interactive, accessibility-first coding environment designed for everyone — especially users with visual impairments, dyslexia, or motor difficulties.

The platform combines:

- A modern in-browser code editor  
- Real-time AI coding assistant  
- Text-to-speech (TTS) for code, output, and chat responses  
- Multi-language code execution  
- Screen-reader optimized UI  
- High-contrast & dyslexia-friendly design  
- Audio-only mode for blind users  
- Project saving & management  
- Interactive docs, tutorials, roadmap & changelog  
- Subscription capabilities  

**Mission:** make programming education accessible to all.

---

## ✨ Key Features

### 🧠 AI Coding Assistant
- Explains code, debugs issues, and answers conceptual questions  
- Integrated TTS (pause/resume/stop controls)  
- Keyboard-first and screen-reader friendly

### 💻 Multi-language Code Editor
Powered by **Monaco**, supporting:
- Python  
- JavaScript  
- C++  

Editor features:
- Syntax highlighting & autocomplete  
- Adjustable font, spacing, and dyslexia-friendly font option  
- Read Code / Read Output with TTS  
- Executes code via backend sandbox (Piston)

### 🔊 Full Accessibility Suite
- Screen reader support  
- Global audio controller (Play/Pause/Stop)  
- High contrast themes & OpenDyslexic font option  
- Keyboard navigation and shortcuts  
- Audio-only mode for blind users

### 📂 Projects & Cloud Save
- Save, duplicate, rename, delete, and export projects  
- File tree support for multi-file projects  
- Organize by language

### 📚 Explore Pages
- Documentation  
- Tutorials  
- Roadmap & Changelog  
- Profile & Settings  
- Audio Mode  
- Admin Dashboard (role-based)

### 💳 Subscription System
- Free vs Premium tiers  
- Payment integration ready (Stripe / LemonSqueezy)  
- Usage quotas, billing history, and plan management

---

## 🏗️ Architecture

### Frontend (React + Vite + TypeScript)
- Component-driven UI with TailwindCSS & shadcn-ui  
- Monaco Editor for in-browser coding  
- Global Audio Controller (Web Speech API + server fallback)  
- Next.js/Vite routing (depending on setup)

### Backend (FastAPI)
- `/api/run` → Executes code via Piston or configurable sandbox  
- `/api/tts` → Generates/serves TTS audio (optional)  
- `/api/projects` → CRUD for projects  
- `/api/auth` → Authentication & user management  
- `/api/users` → Profiles, usage, and subscription state

### Execution Engine
- **Piston API** (or self-hosted Piston) for sandboxed code execution (Python / JS / C++)

### Database & Cache
- PostgreSQL for persistent data (users, projects, usage)  
- Redis for caching, rate-limits, and ephemeral data (optional)

### Storage
- S3 / Supabase Storage for large assets, project zips, and audio files

---

## 🧱 System Diagram (high-level)

