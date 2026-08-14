# TaskFlow Frontend Web Application

A clean, responsive, and accessible Kanban task board interface built with **React**, **TypeScript**, **Vite**, and **Vanilla CSS**.

---

## 1. Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)

### Installation & Launch
```bash
# 1. Navigate to the frontend directory
cd FrontEnd

# 2. Install dependencies
npm install

# 3. Create local environment file
cp .env.example .env
# (On Windows PowerShell: copy .env.example .env)

# 4. Start the Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 2. Features & Interactions

1. **Kanban Board Visualization:** Real-time view of columns ("To Do", "In Progress", "Done") with live task counts on headers.
2. **Task Creation & Editing:** Create tasks with mandatory non-empty title validation and optional descriptions and priority selectors (`Low`, `Medium`, `High`).
3. **Task Deletion:** Instant task removal with optimistic UI updates.
4. **Task Movement (Dual Support):**
   - **Native HTML5 Drag & Drop:** Fluid drag interactions across columns with visual drop target cues.
   - **Accessible Fallback Dropdown:** Per-card column selector for keyboard navigation and screen readers.
5. **Real-time Search & Priority Filtering:**
   - Instant search across task titles and descriptions.
   - One-click filter pills for `All`, `High`, `Medium`, and `Low` priority tasks.
6. **Free-Tier Cold-Start & Keep-Alive Support:**
   - Built-in background heartbeat polling keeps free-tier backends (such as Render) active while the tab is open.
   - Displays a dedicated recovery modal (*"Connection lost. Please wait while the server spins up..."*) if the server is cold-starting, with a container slot ready for the interactive mini-game.
7. **Zero Emojis & Clean SaaS Aesthetics:** Crafted with a neutral slate/zinc palette inspired by Linear and Notion, utilizing open SVG icons (`lucide-react`).

---

## 3. Environment Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the TaskFlow Backend REST API | `http://localhost:5000/api/v1` |
| `VITE_CLIENT_SECRET_TOKEN` | Handshake security token reducing public API attack surface | `taskflow-web-client-v1` |
| `VITE_PING_INTERVAL_MS` | Heartbeat keep-alive frequency in milliseconds | `45000` (45s) |

---

## 4. Evaluation Reflection

- **Trade-offs Made:** Prioritized a robust, custom Vanilla CSS design system over heavy component libraries to maintain zero runtime bloat and complete layout control.
- **What I'd Improve with More Time:** Add user avatars, task comment threads, due date pickers, and subtask checklists.
- **Something Interesting Learned:** Optimistic UI state updates combined with auto-reverting error handlers deliver an instant, lag-free user experience even on slower network connections.
