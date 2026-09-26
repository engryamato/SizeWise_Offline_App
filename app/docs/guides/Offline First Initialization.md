# Offline First Initialization

Phase 0: installable PWA, OPFS‑SQLite boot, dashboard with trial/free badge, stubs for routes, and an empty Duct Sizer viewport ready for Phase 2.

Notes
•	Next.js (App Router) + TypeScript
•	R3F can be added in Phase 2; for now the viewport is a placeholder container
•	SQLite WASM on OPFS bootstrap + first migrations included
•	Service Worker + Manifest for offline install
•	License store (trial → free) and feature flags

Folder tree (minimal):

sizewise/
package.json
next.config.mjs
tsconfig.json
public/
manifest.webmanifest
sw.js
sqlite/
sqlite3.wasm            # place vendor file here (see notes)
sqlite3-opfs-async-proxy.js
app/
layout.tsx
globals.css
login/page.tsx
dashboard/page.tsx
tools/duct-sizer/page.tsx
license/page.tsx
settings/page.tsx
about/page.tsx
not-found.tsx
components/
NavBar.tsx
ToolCard.tsx
ProjectList.tsx
LicenseBadge.tsx
UpdateToast.tsx
db/
openDb.ts
migrations.ts
dao.ts
lib/
featureFlags.ts
licensing.ts
ids.ts
units.ts
sw-client.ts

⸻

package.json

{
"name": "sizewise",
"private": true,
"scripts": {
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "next lint"
},
"dependencies": {
"next": "14.2.5",
"react": "18.2.0",
"react-dom": "18.2.0",
"zustand": "4.5.2",
"zod": "3.23.8"
},
"devDependencies": {
"typescript": "5.5.4"
}
}

next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
experimental: { serverActions: { allowedOrigins: ["*"] } },
eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;

tsconfig.json

{
"compilerOptions": {
"target": "ES2022",
"lib": ["dom", "es2022"],
"jsx": "react-jsx",
"module": "esnext",
"moduleResolution": "bundler",
"strict": true,
"baseUrl": ".",
"paths": {}
},
"include": ["app", "components", "db", "lib", "public/sw.js"]
}

⸻

public/manifest.webmanifest

{
"name": "SizeWise Suite",
"short_name": "SizeWise",
"start_url": "/dashboard",
"display": "standalone",
"background_color": "#0f1216",
"theme_color": "#0f1216",
"icons": [
{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
{ "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
]
}

public/sw.js (PWA shell; revise later with Workbox build if needed)

self.addEventListener('install', (e) => {
self.skipWaiting();
e.waitUntil(caches.open('sw-shell-v1').then((c) => c.addAll([
'/', '/dashboard', '/manifest.webmanifest'
])));
});
self.addEventListener('activate', (e) => { self.clients.claim(); });
self.addEventListener('fetch', (e) => {
const url = new URL(e.request.url);
if (e.request.method !== 'GET') return;
e.respondWith(
caches.match(e.request).then((resp) => resp || fetch(e.request).then((r) => {
const copy = r.clone();
caches.open('sw-runtime-v1').then((c) => c.put(e.request, copy));
return r;
}).catch(() => resp))
);
});

⚠️ SQLite WASM files: download from the official sqlite-wasm release and place in public/sqlite/. Keep filenames consistent with imports below.

⸻

app/layout.tsx

import './globals.css';
import Script from 'next/script';

export const metadata = { title: 'SizeWise', description: 'Offline HVAC Suite' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en">
<head>
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#0f1216" />
</head>
<body>
{children}
{/* SW registration */}
<Script id="sw-reg" strategy="afterInteractive">{
`if ('serviceWorker' in navigator) {             navigator.serviceWorker.register('/sw.js').catch(()=>{});           }`
}</Script>
</body>
</html>
);
}

app/globals.css

:root{ --bg:#0f1216; --glass:rgba(255,255,255,0.06); --stroke:rgba(255,255,255,0.12); --text:#e7ecf3; --muted:#9aa4b2; }
*{box-sizing:border-box}
html,body{height:100%}
body{ margin:0; font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial; color:var(--text);
background:radial-gradient(1200px 800px at 10% -10%,#1a2030 0%,transparent 60%),
radial-gradient(1200px 800px at 110% 10%,#1b2a3a 0%,transparent 60%), var(--bg);
}
.container{max-width:1100px;margin:0 auto;padding:32px}
.topbar{position:sticky;top:0;backdrop-filter:blur(10px); background:var(--glass); border-bottom:1px solid var(--stroke); z-index:10}
.row{display:flex;gap:16px;align-items:center;justify-content:space-between;padding:12px 24px}
.btn{appearance:none;border:1px solid var(--stroke);background:var(--glass);color:var(--text);padding:10px 14px;border-radius:10px;cursor:pointer}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{border:1px solid var(--stroke);background:linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03));border-radius:16px;padding:18px;transition:transform .16s ease, border-color .16s ease;cursor:pointer}
.card:hover{transform:translateY(-2px); border-color:rgba(255,255,255,0.22)}
.card h3{margin:0 0 8px 0}
.badge{display:inline-block;font-size:12px;color:var(--muted);border:1px dashed var(--stroke);padding:4px 8px;border-radius:999px}
.hero{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:24px 0 28px 0}
.hero h1{margin:0;font-size:28px}
.panel{border:1px solid var(--stroke);background:var(--glass);border-radius:14px;padding:16px}
.muted{color:var(--muted)}
.center{display:flex;min-height:100dvh;align-items:center;justify-content:center;padding:24px}
.link{color:#9cc6ff;text-decoration:none}
.toast{position:fixed;right:16px;bottom:16px;border:1px solid var(--stroke);background:var(--glass);backdrop-filter:blur(8px);padding:10px 14px;border-radius:12px}

⸻

components/NavBar.tsx

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LicenseBadge from './LicenseBadge';

export default function NavBar() {
const pathname = usePathname();
return (
<div className="topbar">
<div className="row">
<div style={{display:'flex',gap:12,alignItems:'center'}}>
<Link className="link" href="/dashboard" aria-current={pathname?.startsWith('/dashboard')?'page':undefined}>Dashboard</Link>
<span className="muted">/</span>
<Link className="link" href="/tools/duct-sizer" aria-current={pathname?.startsWith('/tools')?'page':undefined}>Duct Sizer</Link>
<span className="muted">/</span>
<Link className="link" href="/settings" aria-current={pathname==='/settings'?'page':undefined}>Settings</Link>
<span className="muted">/</span>
<Link className="link" href="/license" aria-current={pathname==='/license'?'page':undefined}>License</Link>
</div>
<LicenseBadge />
</div>
</div>
);
}

components/ToolCard.tsx

import Link from 'next/link';
export default function ToolCard({ title, subtitle, href, badge = 'Available' }: { title: string; subtitle: string; href: string; badge?: string; }) {
return (
<Link href={href} className="card">
<div className="badge">{badge}</div>
<h3>{title}</h3>
<div className="muted">{subtitle}</div>
</Link>
);
}

components/ProjectList.tsx

'use client';
import { useEffect, useState } from 'react';
import { listProjects } from '../db/dao';

export default function ProjectList() {
const [rows, setRows] = useState<{id:string;name:string;updated_at:number}[]>([]);
useEffect(() => { listProjects().then(setRows).catch(()=>{}); }, []);
if (!rows.length) return <div className="panel">No projects yet. Create one to get started.</div>;
return (
<div className="grid">
{rows.map(r => (
<div className="panel" key={[r.id](http://r.id/)}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
<strong>{[r.name](http://r.name/)}</strong>
<small className="muted">{new Date(r.updated_at).toLocaleString()}</small>
</div>
<div style={{display:'flex',gap:8,marginTop:10}}>
<button className="btn" onClick={()=>location.href=`/tools/duct-sizer?project=${r.id}`}>Open</button>
<button className="btn" disabled>Duplicate</button>
<button className="btn" disabled>Export</button>
</div>
</div>
))}
</div>
);
}

components/LicenseBadge.tsx

'use client';
import { useEffect, useState } from 'react';
import { getEdition, getTrialInfo } from '../lib/licensing';
export default function LicenseBadge(){
const [label, setLabel] = useState('');
useEffect(()=>{ (async()=>{
const ed = await getEdition();
if (ed === 'trial') {
const t = await getTrialInfo();
setLabel(`Trial: ${t.daysLeft} days left`);
} else if (ed === 'free') setLabel('Free Tier');
else setLabel('Licensed');
})(); },[]);
return <div className="badge" role="status" aria-live="polite">{label}</div>;
}

components/UpdateToast.tsx

'use client';
import { useEffect, useState } from 'react';
export default function UpdateToast(){
const [show, setShow] = useState(false);
useEffect(()=>{
if (!('serviceWorker' in navigator)) return;
navigator.serviceWorker.getRegistration().then((reg)=>{
if (!reg) return;
reg.addEventListener('updatefound', ()=>setShow(true));
});
},[]);
if (!show) return null;
return <div className="toast">Update available. <button className="btn" onClick={()=>location.reload()}>Reload</button></div>;
}

⸻

db/openDb.ts

// SQLite WASM + OPFS bootstrap
// Requires sqlite wasm assets in /public/sqlite/

export type DB = any; // narrow later
let dbPromise: Promise<DB> | null = null;

export async function openDb(): Promise<DB> {
if (dbPromise) return dbPromise;
dbPromise = (async () => {
// @ts-ignore - global module from sqlite wasm loader
const sqlite3 = await (window as any).sqlite3InitModule({ locateFile: (f: string) => `/sqlite/${f}` });
const db = new sqlite3.oo1.OpfsDb('sizewise.db');
db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`);
return db;
})();
return dbPromise;
}

db/migrations.ts

import { openDb } from './openDb';

export async function migrate(){
const db = await openDb();
db.exec(`CREATE TABLE IF NOT EXISTS migrations(id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);`);
const apply = (id: string, sql: string) => {
const row = db.selectValue?.(`SELECT id FROM migrations WHERE id = ?`, [id]);
if (row) return;
db.exec(sql);
db.exec(`INSERT INTO migrations(id, applied_at) VALUES (?, ?)`, [id, Date.now()]);
};

apply('001_core',     `CREATE TABLE IF NOT EXISTS projects (       id TEXT PRIMARY KEY,       name TEXT NOT NULL,       unit_system TEXT NOT NULL,       rules_version TEXT NOT NULL,       created_at INTEGER NOT NULL,       updated_at INTEGER NOT NULL     );     CREATE TABLE IF NOT EXISTS nodes (       id TEXT PRIMARY KEY,       project_id TEXT NOT NULL,       kind TEXT NOT NULL,       x REAL NOT NULL, y REAL NOT NULL, z REAL NOT NULL,       fixed_pressure_pa REAL, fixed_flow_m3s REAL,       meta_json TEXT NOT NULL DEFAULT '{}'     );     CREATE TABLE IF NOT EXISTS edges (       id TEXT PRIMARY KEY,       project_id TEXT NOT NULL,       kind TEXT NOT NULL,       node_from TEXT NOT NULL,       node_to   TEXT NOT NULL,       A REAL NOT NULL, Dh REAL NOT NULL, L REAL NOT NULL, k REAL NOT NULL, K REAL DEFAULT 0,       geom_json TEXT NOT NULL,       meta_json TEXT NOT NULL DEFAULT '{}'     );     CREATE TABLE IF NOT EXISTS results (       project_id TEXT NOT NULL,       edge_id TEXT NOT NULL,       run_id TEXT NOT NULL,       computed_at INTEGER NOT NULL,       Q REAL NOT NULL, V REAL NOT NULL, Re REAL NOT NULL, f REAL NOT NULL, dP REAL NOT NULL,       PRIMARY KEY(project_id, edge_id, run_id)     );     CREATE TABLE IF NOT EXISTS results_latest (       project_id TEXT NOT NULL,       edge_id TEXT NOT NULL PRIMARY KEY,       run_id TEXT NOT NULL,       Q REAL NOT NULL, V REAL NOT NULL, Re REAL NOT NULL, f REAL NOT NULL, dP REAL NOT NULL     );`  );
}

db/dao.ts

import { openDb } from './openDb';
import { migrate } from './migrations';
import { ulid } from '../lib/ids';

export async function initDb(){ await migrate(); }

export async function listProjects(): Promise<{id:string; name:string; updated_at:number}[]> {
const db = await openDb();
const rows: any[] = [];
db.exec({ sql: `SELECT id, name, updated_at FROM projects ORDER BY updated_at DESC`, rowMode: 'object', callback: (r:any)=>rows.push(r) });
return rows as any;
}

export async function createProject(name: string, unit: 'imperial'|'si'){
const db = await openDb();
const now = Date.now();
const id = ulid();
db.exec(`INSERT INTO projects(id,name,unit_system,rules_version,created_at,updated_at) VALUES(?,?,?,?,?,?)`, [id, name, unit, 'smacna-4e@1.0.0', now, now]);
return id;
}

⸻

lib/featureFlags.ts

'use client';
export function flag(name: string, def = false){
try {
const v = sessionStorage.getItem(`ff_${name}`);
return v ? v === '1' : def;
} catch { return def; }
}
export function setFlag(name: string, on: boolean){
try { sessionStorage.setItem(`ff_${name}`, on ? '1' : '0'); } catch {}
}

lib/licensing.ts

'use client';
// Offline trial → free tier licensing
// Stores authoritative values in OPFS (via SQLite later); mirrors status in localStorage for early UI

export type Edition = 'trial'|'free'|'licensed';
const LS_KEY = 'sw_license';

function readLS(){
try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function writeLS(v:any){ try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {}
}

export async function bootstrapLicense(){
const now = Date.now();
const cur = readLS();
if (!cur) {
const trialDays = 14;
const state = { edition: 'trial', install_at: now, trial_ends_at: now + trialDays*86400000, last_run_at: now };
writeLS(state);
return state;
}
// clock tamper detection (basic): if now < last_run_at by more than 24h, drop to free
if (now + 86400000 < cur.last_run_at) { cur.edition = 'free'; }
cur.last_run_at = now;
if (cur.edition === 'trial' && now > cur.trial_ends_at) cur.edition = 'free';
writeLS(cur);
return cur;
}

export async function getEdition(): Promise<Edition> {
const cur = readLS();
return (cur?.edition ?? 'trial') as Edition;
}

export async function getTrialInfo(){
const cur = readLS();
const now = Date.now();
const daysLeft = cur?.trial_ends_at ? Math.max(0, Math.ceil((cur.trial_ends_at - now)/86400000)) : 0;
return { daysLeft };
}

export const FREE_LIMITS = { maxProjects: 2, maxEdgesPerProject: 150 };

lib/ids.ts

// Tiny ULID (sortable IDs)
export function ulid(): string {
const t = Date.now().toString(36).padStart(8,'0');
let r = '';
for (let i=0;i<16;i++) r += Math.floor(Math.random()*36).toString(36);
return (t + r).slice(0, 24);
}

lib/units.ts

export const INCH_TO_M = 0.0254; export const FT_TO_M = 0.3048;
export const M_TO_INCH = 39.3700787402; export const M_TO_FT = 3.280839895;
export const inToM = (v:number)=>v*INCH_TO_M; export const ftToM=(v:number)=>v*FT_TO_M;

lib/sw-client.ts

'use client';
// optional helper to ping SW status; used by UpdateToast internally
export async function getSWReg(){ return navigator.serviceWorker?.getRegistration(); }

⸻

app/login/page.tsx

export default function LoginPage(){
return (
<div className="center">
<div className="panel" style={{minWidth:320}}>
<h2 style={{marginTop:0}}>Login</h2>
<p className="muted">Offline mode doesn’t require login. This page is reserved for future cloud sync.</p>
</div>
</div>
);
}

app/dashboard/page.tsx

'use client';
import { useEffect, useState } from 'react';
import NavBar from '../../components/NavBar';
import ToolCard from '../../components/ToolCard';
import ProjectList from '../../components/ProjectList';
import UpdateToast from '../../components/UpdateToast';
import { bootstrapLicense } from '../../lib/licensing';
import { initDb } from '../../db/dao';

export default function Dashboard(){
const [ready, setReady] = useState(false);
useEffect(()=>{ (async()=>{ await bootstrapLicense(); await initDb(); setReady(true); })(); },[]);
if (!ready) return <div className="center"><div className="panel">Loading offline engine…</div></div>;
return (
<>
<NavBar />
<div className="container">
<div className="hero">
<div>
<h1>Dashboard</h1>
<div className="muted">Select a tool or open a project.</div>
</div>
</div>
<div className="grid" style={{marginBottom:20}}>
<ToolCard title="Duct Sizer" subtitle="Draw ducts. Live airflow & pressure." href="/tools/duct-sizer" />
<div className="card" aria-disabled>
<div className="badge">Coming soon</div>
<h3>Grease Duct Sizer</h3>
<div className="muted">NFPA 96 ruleset</div>
</div>
</div>
<h3>Projects</h3>
<ProjectList />
</div>
<UpdateToast />
</>
);
}

app/tools/duct-sizer/page.tsx

'use client';
import { useEffect, useRef } from 'react';
import NavBar from '../../../components/NavBar';

export default function AirDuctSizerPage(){
const hostRef = useRef<HTMLDivElement|null>(null);
useEffect(()=>{
if (!hostRef.current) return;
hostRef.current.innerHTML = '';
const el = document.createElement('div');
el.textContent = '3D Canvas Placeholder — plug R3F/Three here (Phase 2)';
el.className = 'panel';
el.style.padding = '24px';
hostRef.current.appendChild(el);
},[]);
return (
<>
<NavBar />
<div className="container">
<h1 style={{margin:'6px 0 18px'}}>Duct Sizer</h1>
<div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
<div ref={hostRef} />
<div className="panel">
<h3 style={{marginTop:0}}>Properties</h3>
<div className="muted">Inputs and live results will appear here.</div>
</div>
</div>
</div>
</>
);
}

app/license/page.tsx

'use client';
import { useEffect, useState } from 'react';
import NavBar from '../../components/NavBar';
import { bootstrapLicense, getEdition, getTrialInfo, FREE_LIMITS } from '../../lib/licensing';

export default function LicensePage(){
const [state, setState] = useState({ edition: 'trial', daysLeft: 0 });
useEffect(()=>{ (async()=>{
await bootstrapLicense();
const ed = await getEdition();
const t = await getTrialInfo();
setState({ edition: ed, daysLeft: t.daysLeft });
})(); },[]);
return (
<>
<NavBar />
<div className="container">
<h1>License & Limits</h1>
<div className="panel">
<p>Edition: <strong>{state.edition}</strong></p>
{state.edition==='trial' && <p>Trial days left: <strong>{state.daysLeft}</strong></p>}
{state.edition==='free' && (
<ul>
<li>Max projects: {FREE_LIMITS.maxProjects}</li>
<li>Max edges per project: {FREE_LIMITS.maxEdgesPerProject}</li>
</ul>
)}
<p className="muted">Offline licensing — no sign-in required.</p>
</div>
</div>
</>
);
}

app/settings/page.tsx

import NavBar from '../../components/NavBar';
export default function Settings(){
return (
<>
<NavBar />
<div className="container">
<h1>Settings</h1>
<div className="panel">
<div className="muted">Units, theme, and performance toggles will go here.</div>
</div>
</div>
</>
);
}

app/about/page.tsx

import NavBar from '../../components/NavBar';
export default function About(){
return (
<>
<NavBar />
<div className="container">
<h1>About</h1>
<div className="panel">
<div>SizeWise Suite — Offline Edition</div>
<div className="muted">Ruleset: SMACNA 4e v1.0.0</div>
</div>
</div>
</>
);
}

app/not-found.tsx

export default function NotFound(){
return <div className="center"><div className="panel">Page not found</div></div>;
}

⸻

HOW TO RUN (dev)
1.	pnpm i (or npm/yarn)
2.	Place SQLite WASM files in public/sqlite/ as referenced
3.	pnpm dev → open [http://localhost:3000](http://localhost:3000/)
4.	Install PWA (browser prompt or menu). Toggle airplane mode — app should still load.