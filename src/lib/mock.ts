import type { StepStatus } from '../types'

export interface Project {
  id: string
  name: string
  description: string
  stack: string[]
  progress: number
  updated: string
  status: 'active' | 'paused' | 'shipped'
}

export const PROJECTS: Project[] = [
  {
    id: 'p-1',
    name: 'Portfolio Waterglass',
    description: 'Single-page portfolio with layered glass surfaces and a floating hero orb.',
    stack: ['React', 'TypeScript', 'Tailwind'],
    progress: 88,
    updated: '2 min ago',
    status: 'active',
  },
  {
    id: 'p-2',
    name: 'NEXORA Agent Core',
    description: 'Tool-use loop, safety classifier and audit trail for the desktop agent.',
    stack: ['Node', 'TypeScript', 'Claude'],
    progress: 62,
    updated: '18 min ago',
    status: 'active',
  },
  {
    id: 'p-3',
    name: 'Invoice Automator',
    description: 'Reads inbound invoices, extracts totals and files them into the ledger.',
    stack: ['Python', 'Pytest'],
    progress: 100,
    updated: 'Yesterday',
    status: 'shipped',
  },
  {
    id: 'p-4',
    name: 'Site Monitor',
    description: 'Headless browser checks for uptime, layout drift and broken links.',
    stack: ['Playwright', 'Node'],
    progress: 41,
    updated: '3 days ago',
    status: 'paused',
  },
  {
    id: 'p-5',
    name: 'Design Tokens',
    description: 'Shared waterglass token set for web and desktop surfaces.',
    stack: ['CSS', 'Figma'],
    progress: 100,
    updated: '5 days ago',
    status: 'shipped',
  },
  {
    id: 'p-6',
    name: 'Research Digest',
    description: 'Collects reading links and produces a weekly summary with citations.',
    stack: ['Python', 'Gemini'],
    progress: 27,
    updated: '1 week ago',
    status: 'paused',
  },
]

export interface TreeNode {
  name: string
  kind: 'folder' | 'file'
  children?: TreeNode[]
}

export const FILE_TREE: TreeNode[] = [
  {
    name: 'src',
    kind: 'folder',
    children: [
      {
        name: 'components',
        kind: 'folder',
        children: [
          { name: 'Orb.tsx', kind: 'file' },
          { name: 'Sidebar.tsx', kind: 'file' },
          { name: 'TaskPanel.tsx', kind: 'file' },
        ],
      },
      {
        name: 'lib',
        kind: 'folder',
        children: [
          { name: 'agent.ts', kind: 'file' },
          { name: 'cn.ts', kind: 'file' },
        ],
      },
      { name: 'App.tsx', kind: 'file' },
      { name: 'index.css', kind: 'file' },
    ],
  },
  { name: 'public', kind: 'folder', children: [{ name: 'favicon.svg', kind: 'file' }] },
  { name: 'package.json', kind: 'file' },
  { name: 'vite.config.ts', kind: 'file' },
  { name: 'README.md', kind: 'file' },
]

export interface FileRow {
  id: string
  name: string
  kind: 'file' | 'folder'
  size: string
  modified: string
  type: string
  preview: string
}

export const FILES: FileRow[] = [
  {
    id: 'f-1',
    name: 'App.tsx',
    kind: 'file',
    size: '6.2 KB',
    modified: '2 min ago',
    type: 'TypeScript React',
    preview:
      "export default function App() {\n  const agent = useAgent()\n\n  return (\n    <AppShell>\n      <Workspace agent={agent} />\n      <TaskPanel task={agent.task} />\n    </AppShell>\n  )\n}",
  },
  {
    id: 'f-2',
    name: 'Orb.tsx',
    kind: 'file',
    size: '2.8 KB',
    modified: '14 min ago',
    type: 'TypeScript React',
    preview:
      "export function Orb({ state, size = 260 }: OrbProps) {\n  return (\n    <div className=\"orb\" data-state={state}>\n      <div className=\"orb-aura\" />\n      <div className=\"orb-sphere\" />\n    </div>\n  )\n}",
  },
  {
    id: 'f-3',
    name: 'index.css',
    kind: 'file',
    size: '18.4 KB',
    modified: '26 min ago',
    type: 'CSS',
    preview:
      '.glass {\n  backdrop-filter: blur(22px) saturate(150%);\n  border: 1px solid rgb(var(--glass-border) / 0.18);\n  background: linear-gradient(135deg, ...);\n  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.22);\n}',
  },
  {
    id: 'f-4',
    name: 'agent.ts',
    kind: 'file',
    size: '7.1 KB',
    modified: '1 hour ago',
    type: 'TypeScript',
    preview:
      'export function runAgent(prompt: string, handlers: AgentHandlers): AgentRun {\n  // Replace this simulation with the real transport:\n  //   POST /api/agent  (SSE)\n  //   window.nexora.run(prompt)  (Electron IPC)\n}',
  },
  {
    id: 'f-5',
    name: 'package.json',
    kind: 'file',
    size: '1.1 KB',
    modified: '3 hours ago',
    type: 'JSON',
    preview:
      '{\n  "name": "nexora",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc --noEmit && vite build"\n  }\n}',
  },
  {
    id: 'f-6',
    name: 'assets',
    kind: 'folder',
    size: '—',
    modified: '2 days ago',
    type: 'Folder',
    preview: '4 items · 2.4 MB\n\norb-01.webp\nglass-noise.png\nlogo-mark.svg\nhero-poster.jpg',
  },
  {
    id: 'f-7',
    name: 'README.md',
    kind: 'file',
    size: '3.4 KB',
    modified: '3 days ago',
    type: 'Markdown',
    preview:
      '# NEXORA\n\nA waterglass AI agent operating system.\n\n## Run\n\n    npm install\n    npm run dev\n',
  },
  {
    id: 'f-8',
    name: 'tsconfig.json',
    kind: 'file',
    size: '0.6 KB',
    modified: '4 days ago',
    type: 'JSON',
    preview: '{\n  "compilerOptions": {\n    "strict": true,\n    "jsx": "react-jsx"\n  }\n}',
  },
]

export interface HistoryItem {
  id: string
  title: string
  status: StepStatus
  model: string
  when: string
  duration: string
  steps: number
  summary: string
  live?: boolean
}

export const HISTORY: HistoryItem[] = [
  {
    id: 'h-1',
    title: 'Build portfolio website',
    status: 'completed',
    model: 'Claude Sonnet 4.5',
    when: 'Today · 18:42',
    duration: '4m 12s',
    steps: 5,
    summary: 'Scaffolded a single-page portfolio with waterglass surfaces and responsive layout.',
  },
  {
    id: 'h-2',
    title: 'Analyze workspace files',
    status: 'completed',
    model: 'Claude Sonnet 4.5',
    when: 'Today · 17:05',
    duration: '1m 38s',
    steps: 4,
    summary: 'Indexed 1,284 files, flagged 12 duplicate groups and 2 oversized build folders.',
  },
  {
    id: 'h-3',
    title: 'Run test suite',
    status: 'error',
    model: 'Claude Haiku 4.5',
    when: 'Today · 15:20',
    duration: '0m 46s',
    steps: 4,
    summary: 'Two assertions failed in the invoice parser; execution stopped before commit.',
  },
  {
    id: 'h-4',
    title: 'Automate browser task',
    status: 'completed',
    model: 'Gemini 3 Pro',
    when: 'Yesterday · 21:11',
    duration: '2m 04s',
    steps: 4,
    summary: 'Collected pricing rows from three vendor pages and exported a comparison table.',
  },
  {
    id: 'h-5',
    title: 'Create Python project',
    status: 'completed',
    model: 'Claude Sonnet 4.5',
    when: 'Yesterday · 11:47',
    duration: '3m 30s',
    steps: 5,
    summary: 'Generated package layout, typed modules and a passing pytest suite.',
  },
  {
    id: 'h-6',
    title: 'Refactor authentication flow',
    status: 'running',
    model: 'Claude Opus 4.1',
    when: 'Today · 19:02',
    duration: 'running',
    steps: 6,
    summary: 'Mid-migration: token refresh is updated, route guards still in progress.',
  },
]

export interface BrowserTab {
  id: string
  title: string
  url: string
}

export const BROWSER_TABS: BrowserTab[] = [
  { id: 't-1', title: 'Waterglass Studio', url: 'https://waterglass.studio' },
  { id: 't-2', title: 'Docs · NEXORA', url: 'https://nexora.local/docs' },
]

export const BROWSER_PREVIEW = {
  title: 'Waterglass Studio',
  headline: 'Design that moves like water.',
  body: 'A calm surface for focused work — layered glass, soft light, and nothing competing for attention.',
  cards: [
    { title: 'Surfaces', body: 'Frosted glass panels with realistic depth and edge light.' },
    { title: 'Motion', body: 'Liquid transitions that stay under 200 ms.' },
    { title: 'Clarity', body: 'Transparency used sparingly so text always reads.' },
  ],
}
