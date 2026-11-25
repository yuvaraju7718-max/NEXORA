# NEXORA — Waterglass AI Agent OS

A desktop-first AI agent interface built around a **waterglass** design language:
transparent blue glass, soft caustics and ripples, frosted surfaces, floating
translucent panels and a living orb that reflects the agent's state.

The frontend is fully interactive today (navigation, chat streaming, task
execution, projects, browser surface, file manager, terminal, history, settings
and API-key management). The agent transport is a high-fidelity local simulation
that speaks the same contract a real backend will use.

## Stack

| Layer      | Choice                                   |
| ---------- | ---------------------------------------- |
| UI         | React 19 + TypeScript                    |
| Styling    | Tailwind CSS 4 + a custom design system  |
| Motion     | Framer Motion                            |
| Icons      | Lucide React                             |
| Build      | Vite 8                                   |
| Orb        | Pure CSS (no WebGL)                      |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # typecheck + vite build
npm run preview
```

Desktop shell (Electron 45):

```bash
npm run dev:desktop  # Vite + Electron window on the dev server
npm run desktop      # build first, then open dist/index.html in Electron
```

`electron/main.mjs` owns the native window; `electron/preload.cjs` exposes a
small, isolated `window.nexora` bridge (`getInfo`, `openExternal`). Settings →
About shows the Electron/Chromium version when running as a desktop app. Links
that try to leave the app open in the system browser. Vite uses relative asset
paths (`base: './'`) so the built app also works over `file://`.

Other scripts:

```bash
npm run typecheck    # tsc --noEmit
npm run mock:agent   # SSE test backend on :8787
npm run agent:ollama # local Ollama bridge on :8788
```

## What works

- **Sidebar navigation** — Home, New Chat, Projects, Browser, File Manager,
  Terminal, Task History, Settings, plus theme toggle and collapse.
- **Workspace** — animated orb (idle / listening / thinking / executing /
  completed), streaming assistant replies, five suggested commands.
- **Command composer** — Enter to send, Shift+Enter for newline, file
  attachments, Web Speech API voice input, stop/cancel.
- **Task panel** — live task title, progress, activity, per-step status,
  elapsed time and error surfacing. Slides in as a drawer below `xl`.
- **Quick actions** — Create project, Open browser, Run terminal, Manage files,
  Explore models.
- **Projects** — search, create and run a project.
- **Browser** — tabbed simulated page with address bar and "automate page".
- **File Manager** — tree, filterable list and preview with copy.
- **Terminal** — interactive mock shell (`help`, `ls`, `pwd`, `echo`, `date`,
  `whoami`, `nexora`, `copy`, `clear`, `agent <prompt>`), command history.
- **Task History** — filters, expandable rows and re-run. Every run from the
  current session is appended automatically (status, duration, steps, summary),
  badged **This session**, persisted in `localStorage` and clearable without
  touching the sample history.
- **Settings** — theme, reduce-motion, model and autonomy policy.
- **API Key** — provider picker, show/hide, local format validation, save.
- **Keyboard** — `Ctrl/Cmd + K` focuses the composer, `Esc` closes the drawer.
- **Responsive** — sidebar collapses to a mobile tab bar; task panel becomes a
  drawer.

## Project structure

```
src/
  App.tsx                    app shell, navigation, state wiring
  index.css                  waterglass design system, orb, animations
  types.ts                   shared types, model list, default settings
  lib/
    agent.ts                 agent transport + AgentHandlers contract
    mock.ts                  projects, files, history, browser preview data
    cn.ts                    class merge + formatting helpers
  hooks/
    useAgent.ts              messages, task and status state
    useTheme.ts              dark/light persistence
    usePersistentState.ts    localStorage-backed state
  components/
    WaterglassBackground.tsx blobs, light rays, grain, vignette
    Orb.tsx                  CSS orb with per-state animation
    Sidebar.tsx  TopBar.tsx  Workspace.tsx  ChatStream.tsx
    CommandComposer.tsx  TaskPanel.tsx  QuickActions.tsx
    ui/                      Button, Field, Toggle, Badge, SectionCard…
    views/                   Projects, Browser, Files, Terminal, History,
                             Settings, ApiKey, ViewFrame
electron/
  main.mjs                   native window, IPC handlers, navigation policy
  preload.cjs                isolated window.nexora bridge
scripts/
  dev-desktop.mjs            Vite + Electron dev launcher
  mock-agent.mjs             SSE test backend
```

## Local Ollama (no API key)

NEXORA can stream responses from a local [Ollama](https://ollama.com) model.

```bash
ollama pull llama3.2
npm run agent:ollama                  # http://localhost:8788/api/agent
npm run dev                           # in another terminal
```

Open **Settings → Agent → Local model (Ollama)**, enable it, pick a model, and
send a prompt. Tokens stream through the same `AgentEvent` contract as the
simulation, so the chat, task panel, history and cancel button all behave the
same. The desktop Electron shell can also call Ollama over IPC, so the local
model works without the HTTP bridge.

## Connecting a real agent

The UI never talks to a model directly. It only consumes `AgentHandlers` from
`src/lib/agent.ts`:

```ts
export interface AgentHandlers {
  onStatus: (status: OrbState) => void
  onTask: (task: AgentTask) => void
  onToken: (delta: string) => void
  onDone: () => void
  onError: (message: string) => void
}
```

`runAgent` picks the transport at runtime:

- **No configuration** → the local simulation.
- **`VITE_AGENT_ENDPOINT` set** → `runRemoteAgent`, which `POST`s
  `{ "prompt": "…" }` and streams events back.

Create `.env.local` (or copy `.env.example`):

```bash
VITE_AGENT_ENDPOINT=http://localhost:8787/api/agent
```

No backend yet? Run the bundled mock that streams the exact same protocol:

```bash
npm run mock:agent   # http://localhost:8787/api/agent
```

The endpoint should reply with one of `text/event-stream` (SSE), NDJSON, or a
single JSON body. Every frame is one of:

```ts
type AgentEvent =
  | { type: 'status'; status: 'idle' | 'listening' | 'thinking' | 'executing' | 'completed' }
  | { type: 'task'; task: AgentTask }          // same shape as src/types.ts
  | { type: 'token'; delta: string }           // streamed assistant text
  | { type: 'done' }
  | { type: 'error'; message: string }
```

SSE example:

```
data: {"type":"status","status":"thinking"}

data: {"type":"task","task":{"id":"t1","title":"Build a portfolio","status":"running","steps":[…]}}

data: {"type":"token","delta":"Scaffolding"}

data: {"type":"done"}
```

Cancellation aborts the request (`AbortController`), so a streaming backend
stops work when the user presses **Stop**. Settings → About shows whether the
app is on the live endpoint or the simulation.

`useAgent` already handles message assembly, streaming tokens, cancellation and
resetting, so no component needs to change.

The Electron bridge already provides `window.nexora` (identity, `getInfo`,
`openExternal`, `listOllamaModels`, `run`). `runAgent` prefers this bridge in
desktop mode, so the local Ollama model can be used without the HTTP bridge.

## Design tokens

Defined as CSS variables in `src/index.css` and re-themed for light mode:

| Token         | Dark      | Light     |
| ------------- | --------- | --------- |
| Background    | `#06182B` | `#DFF1FA` |
| Secondary     | `#0A2742` | `#F4FAFF` |
| Accent (cyan) | `#42D9F5` | `#0E9FC4` |
| Text          | `#F4FAFF` | `#092135` |
| Muted         | blue-grey | blue-grey |

Set `data-theme="light"` on `<html>` to switch themes; `data-motion="reduced"`
disables ambient motion.

## Notes

- Runs are simulated by default. Enable local Ollama for free real streaming, or
  point `VITE_AGENT_ENDPOINT` at a backend that speaks the AgentEvent protocol.
- API keys entered in this web build stay in `localStorage`; the desktop build
  is intended to store them with OS-level encryption.
- No telemetry. Network calls only happen when you explicitly configure an agent
  endpoint or local Ollama.
