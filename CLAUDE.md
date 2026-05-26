# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered laboratory management chatbot (iLab) for Universitas Gunadarma students. Students interact via chat to get answers and create support tickets; admins manage tickets and the knowledge base via a dashboard.

## Commands

### Backend (Express.js, port 3000)
```bash
cd backend
npm install
npm run dev    # node --watch auto-reload
npm start      # production
```

### Frontend (React/Vite, port 5173)
```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

### Environment Setup
Copy `backend/.env.example` to `backend/.env` and fill in:
- `GROQ_API_KEY_REASONING` — API key for the reasoning model (e.g. `openai/gpt-oss-20b`)
- `GROQ_API_KEY_VISION` — API key for the vision model (e.g. `meta-llama/llama-4-scout-17b-16e-instruct`)
- `MODEL_REASONING` — model name for chat/tool-calling
- `MODEL_VISION` — model name for image description
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_KEY` — Service Role key (not anon key)
- `PORT` — defaults to 3000

## Architecture

### Request Flow
1. Frontend (`Chat.jsx`) sends `POST /chat` with `{ messages, npm, file? }`
2. `backend/src/routes/chat.js` fetches the knowledge base, appends it to the system prompt, and calls `groqReasoning`
3. If a file is attached: PDFs are parsed with `pdf-parse` and uploaded to Supabase Storage (`KRS-File` bucket); images are described by `groqVision`
4. If the model triggers a tool call, `backend/src/tools/index.js` dispatches to the handler, injects `krs_url` if applicable, then sends the result back to `groqReasoning` for the final reply
5. Final message is saved to `chat_sessions` and returned to the frontend

### Two-Model Pipeline
- `groqReasoning` (`lib/groq.js`) — handles all chat, tool-calling, and final replies
- `groqVision` (`lib/groq.js`) — only used to describe attached images; result is injected as text context into the reasoning model's next turn

### Key Files
| File | Role |
|------|------|
| `backend/src/routes/chat.js` | Core AI loop — KB injection, file processing, tool dispatch, session save |
| `backend/src/tools/index.js` | Tool definitions (OpenAI function-calling format) and handler registry |
| `backend/src/tools/buatTiket.js` | Creates ticket in Supabase; validates required fields per category |
| `backend/src/tools/cekStatus.js` | Queries ticket by `kode_tiket` (e.g. TKT-001) or UUID or NPM |
| `backend/src/routes/tickets.js` | Admin CRUD for tickets; `GET /:id/krs` returns a 5-min signed URL |
| `backend/src/routes/knowledge-base.js` | Public GET; admin POST (upsert) and PUT (edit by id) and DELETE |
| `backend/src/middleware/authMiddleware.js` | JWT validation via Supabase for all admin routes |
| `frontend/src/lib/api.js` | Axios instance; auto-attaches `admin_token` from localStorage |
| `frontend/src/pages/Chat.jsx` | Student chat UI — NPM login, file upload, welcome screen |
| `frontend/src/pages/AdminDashboard.jsx` | Admin UI — ticket management + knowledge base CRUD |
| `frontend/src/components/ChatBubble.jsx` | Renders messages; detects `https://` and `www.` URLs as clickable links |
| `frontend/src/components/TicketCard.jsx` | Ticket card with status selector and KRS viewer |

### Database Tables (Supabase/PostgreSQL)
- **tickets** — `id, npm, nama_mahasiswa, judul, kategori, status, ringkasan, pesan_asli, detail (JSONB), kode_tiket, krs_url, created_at`
- **knowledge_base** — `id, topik (unique), konten, updated_at`
- **chat_sessions** — `npm, role, content, created_at`

### Ticket Numbering
Global sequential codes (`TKT-001`, `TKT-002`, …) generated in `buatTiket.js` by counting all existing tickets + 1.

### Auth
- Students identify with NPM (student ID) stored in `localStorage`; no password
- Admins authenticate with email/password via Supabase Auth; JWT stored as `admin_token` in `localStorage`
- `ProtectedRoute` guards `/admin/dashboard`; `authMiddleware` guards all ticket and KB write routes

### Routes Summary
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat` | public | Main AI chat endpoint |
| GET | `/history/:npm` | public | Fetch chat history |
| DELETE | `/history/:npm` | public | Clear chat history |
| GET | `/tickets` | admin | List all tickets |
| PATCH | `/tickets/:id` | admin | Update ticket status |
| DELETE | `/tickets/:id` | admin | Delete ticket |
| GET | `/tickets/:id/krs` | admin | Get signed URL for KRS file |
| GET | `/knowledge-base` | public | List KB entries |
| POST | `/knowledge-base` | admin | Add new KB entry (upsert by topik) |
| PUT | `/knowledge-base/:id` | admin | Edit KB entry (topik + konten) |
| DELETE | `/knowledge-base/:id` | admin | Delete KB entry |
| POST | `/auth/login` | public | Admin login |

### Adding a New Tool
1. Create handler in `backend/src/tools/<nama>.js`
2. Register definition and handler in `backend/src/tools/index.js`
3. Restart backend

### Adding Knowledge Base Entries
URLs in KB konten must include `https://` (e.g. `https://v-class.gunadarma.ac.id`) so the frontend renders them as clickable links.

### Frontend Assets
Place `gunadarma.png` in `frontend/public/` for the welcome screen logo.

## Language
UI text, comments, and system prompts are in Indonesian (Bahasa Indonesia). Keep new additions consistent with this convention.
