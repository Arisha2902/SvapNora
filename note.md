# Project Notes — SvapNora / KINETIC

Working notes for the project root. Parallel to `frontend/`.

---

## 1. Styling — important

Note: the project uses plain CSS (`src/index.css` design system), not Tailwind — no `@tailwind` directives and no `tailwindcss` dependency, so nothing to install there.

- The whole design system (tokens, breakpoints, components) lives in `frontend/src/index.css`.
- Do **not** add `tailwindcss`, `postcss` config, or `@tailwind base/components/utilities` layers.
- Static pages under `frontend/public/` each carry their own stylesheet (`about.css`, `services.css`, `products.css`, `terms.css`, `glowlang.css`) and do not go through the React app.
- Google Fonts (Inter + JetBrains Mono) are loaded from `index.html` — needs internet on first load, otherwise it falls back to system fonts.

---

## 2. Installation details

### Prerequisites

| Tool | Tested version | Required |
| --- | --- | --- |
| Node.js | v22.17.1 | >= 18 |
| npm | 11.5.1 | >= 9 |
| MongoDB | 8.0 (local `mongod`) or MongoDB Atlas | backend only |

Shell used on this machine: **PowerShell** (VS Code terminal). Use PowerShell-safe commands (`New-Item -ItemType Directory -Force`), not `mkdir -p` / `touch` / `rm -rf` / `&&`.

### Frontend install

```powershell
cd D:\SvapNora\frontend
npm install
npm run dev
```

- Dev server: http://localhost:5173 (also on the LAN at `http://192.168.29.246:5173`)
- `node_modules/` is already installed, so `npm run dev` works immediately.
- Lockfile is committed (`package-lock.json`) — reinstall with `npm ci` for an exact restore.

### Frontend scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR on port 5173 |
| `npm run build` | Production build into `frontend/dist/` |
| `npm run preview` | Serve the production build locally |

### Frontend dependencies (complete list)

```
dependencies     : react ^18.3.1, react-dom ^18.3.1
devDependencies  : vite ^5.4.11 (installed 5.4.21), @vitejs/plugin-react ^4.3.4
```

Nothing else is used — no router, no state library, no CSS framework, no HTTP client
(the site currently uses `fetch` directly where needed).

### Frontend structure

```
frontend/
├── index.html              Vite entry (fonts, meta, #root)
├── vite.config.js          React plugin, host:true, port 5173
├── package.json            scripts: dev / build / preview
├── public/                 static multi-page files served as-is
│   ├── about.html|.css|.js
│   ├── services.html|.css|.js
│   ├── products.html|.css|.js
│   ├── projects-data.js    shared project dataset
│   ├── project-detail.html|.js
│   ├── terms.html|.css|.js
│   ├── glowlang.html|.css|.js
│   └── nav-core.js         shared navigation
└── src/                    React SPA
    ├── main.jsx            createRoot entry
    ├── App.jsx             page composition
    ├── index.css           design system (plain CSS)
    ├── components/         Button, Navbar, Footer, TerminalCard, cards, icons, diagrams
    ├── components/sections/ Hero, Services, WhyUs, HowWeWork, WhoWeServe, CTABanner, Contact
    └── hooks/              useTheme.js, useReveal.js
```

### Environment variables (frontend)

None. There is no `.env` file and no `import.meta.env.*` / `VITE_*` usage anywhere in
`src/`. When the API client is added, create `frontend/.env.local`:

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

and read it as `import.meta.env.VITE_API_BASE_URL`.

### Backend (in progress)

```
cd D:\SvapNora\backend
npm install
npm run dev        # nodemon, port 5000
npm run seed       # demo data
```

- Requires MongoDB on `mongodb://127.0.0.1:27017/kinetic`, or a free MongoDB Atlas URI
  in `backend/.env` (`MONGO_URI=...`).
- Configuration template: `backend/.env.example` → copy to `backend/.env`.
- CORS origin is `http://localhost:5173`, so start the frontend first (or both).

---

## 3. Fixed: broken imports that stopped `npm run dev`

Vite failed with *“dependencies are imported but could not be resolved”*. Causes:

| File | Bad import | Fix |
| --- | --- | --- |
| `src/components/sections/HowWeWork.jsx` | `'src/components/SectionHeader.jsx'` (bare specifier) | `'../SectionHeader.jsx'` |
| `Contact.jsx`, `Services.jsx`, `CTABanner.jsx`, `WhoWeServe.jsx` | `'../../frontend/src/components/...'` → resolves to `src/frontend/src/...` | `'../...'` |

Rule: from `src/components/sections/`, sibling components are `../Component.jsx`.
Never write `frontend/src/...` inside `src/` — the path already starts at `src/`.

**Verified:** all 21 modules in `src/` transform with HTTP 200, and `/`, `about`,
`services`, `products`, `projects`, `project-detail`, `terms`, `glowlang` all return 200.

---

## 4. Conventions

- PowerShell only for shell work; files are created by tooling, not by hand.
- `frontend/` is owned by the website step — backend work must not modify it.
- Three separate portal areas (public site, employee/customer portals, admin panel)
  must stay isolated: different roles, different cookies, different JWT secrets.
