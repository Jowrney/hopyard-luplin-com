# 🌿 Hopyard Designer

> Hopyard trellis planning and cost estimation
> Built by HOPEDEN Agricultural Corporation

## OpenAI WebMCP Challenge

Hopyard Designer by HOPEDEN is an existing human-operated hopyard planning application extended during the 2026 OpenAI WebMCP Challenge into a shared human-agent design workspace.

### What was added for the challenge

- Imperative WebMCP site tools registered on the top-level design page
- Non-destructive design simulation with stable candidate IDs
- A visual comparison tray for up to three agent-proposed alternatives
- Temporary 2D/3D preview with explicit **Apply** and **Discard** controls
- Dynamic registration of `apply_candidate` and `discard_preview` only while a preview is active
- A sourced North American 18 ft high-trellis reference profile
- BlenderMCP-authored GLB assets for Korean steel and North American wood trellis components
- A public guest route that keeps the normal authenticated workspace protected

### Guest demo

- Local: `http://localhost:3434/design/demo`
- Production after deployment: `https://hopyard.luplin.com/design/demo`

The guest route does not require an account. Saving to a user project remains available only in the authenticated `/design` workspace.

The application starts in English for challenge reviewers. Use the `EN / 한국어` control to switch the complete UI and estimate PDF to Korean; the preference is stored locally in the browser. WebMCP tool contracts remain English for interoperable agent use.

### WebMCP tools

| Tool | Purpose | State |
|---|---|---|
| `get_design_context` | Read the current design, quantities, safety, pricing, and collaboration state | Read only |
| `list_regional_profiles` | Read sourced regional systems and material specifications | Read only |
| `simulate_design` | Calculate an alternative without changing the visible design | Read only |
| `show_candidates` | Put one to three simulated alternatives in the shared comparison tray | UI only |
| `preview_candidate` | Temporarily apply one visible candidate to the shared canvas | Temporary |
| `apply_candidate` | Keep the preview as the active design after explicit user approval | Dynamic write |
| `discard_preview` | Restore the exact design from before the preview | Dynamic write |

ChatGPT Desktop supports the required imperative API directly. The production origin is enrolled in Chrome's WebMCP Origin Trial through November 17, 2026, so Chrome 149–156 can activate the API without a local flag. For local development, enable `chrome://flags/#enable-webmcp-testing` and relaunch Chrome.

### Verify WebMCP in Chrome

Run Chrome with WebMCP and a debugging port, open `/design/demo`, then run:

```bash
node scripts/webmcp/check-cdp.mjs 9333
node scripts/webmcp/exercise-cdp.mjs 9333
```

The exercise verifies this complete browser-mediated journey:

```text
simulate → show → preview → dynamic apply/discard tools → discard → exact restore
```

### Rebuild the Blender asset kit

The generated asset kit contains original procedural geometry and no downloaded third-party models.

1. Open Blender with the BlenderMCP add-on connected on `127.0.0.1:9876`.
2. Run:

```bash
uv run --with mcp python scripts/blender/generate_hopyard_assets_mcp.py
```

Outputs:

- `assets/blender/hopyard-asset-kit.blend` — editable Blender source
- `public/models/hopyard-asset-kit.glb` — web runtime asset kit

The web renderer loads the GLB and uses `InstancedMesh` for repeated poles. Wires and layout remain procedural so every WebMCP candidate updates immediately.

### Regional data integrity

The bundled North American profile uses dimensions and material specifications from [Nebraska Extension EC3026 — Hops on a Quarter-Acre](https://extensionpublications.unl.edu/assets/pdf/ec3026.pdf). It is intentionally marked `reference-only`: the app does not claim live US pricing or local structural approval.

All structural results are preliminary planning information. Local wind loads, soil conditions, building codes, and construction decisions require review by a qualified local engineer.

---

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables (authentication and saved projects)
```bash
cp .env.example .env.local
# Add the self-hosted Supabase anon/publishable key
```

The `/design/demo` guest route can use its bundled reference catalog when Supabase is unavailable.

### 3. Start the development server
```bash
npm run dev
# http://localhost:3434
```

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create the production build |
| `npm test` | Run calculation, profile, i18n, deployment, and WebMCP contract tests |
| `npm run typecheck` | Run the TypeScript type checker |

---

## Project structure

```
hopeden-designer/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── prices/        # Material price map
│   │   └── admin/         # Administrative CRUD
│   └── design             # Design workspace and public demo
├── lib/
│   ├── calculations/      # Pure calculation functions
│   │   ├── quantities.ts  # Pole, wire, and plant quantities
│   │   ├── loads.ts       # Hop and wind loads
│   │   └── estimate.ts    # Cost estimate
│   ├── supabase/          # Supabase browser/server client
│   └── webmcp/            # WebMCP contracts and registration
├── stores/
│   ├── designStore.ts     # Shared design state (Zustand)
│   └── candidateStore.ts  # Human-reviewed agent alternatives
└── types/index.ts         # Shared TypeScript types
```

---

## Engineering principles

### Do not invent live prices

```typescript
// Correct: read active market prices from the store/API.
const { getPrice } = usePriceStore()
const poleCost = getPrice('POLE_STEEL_60_2T_6M') * poleCount

// Incorrect: claim a hard-coded value is live pricing.
const poleCost = 35000 * poleCount
```

### Keep calculations pure

Quantity, load, and cost calculations live in pure functions under `/lib/calculations/`, outside UI components.

### TypeScript strict mode

Avoid `any`; shared contracts belong in `/types/index.ts`.

---

## Technology

- **Frontend**: Next.js 14 + React 18 + TypeScript (strict)
- **2D**: Konva.js + react-konva
- **3D**: Three.js + @react-three/fiber
- **State**: Zustand
- **DB/Auth**: Self-hosted Supabase
- **Styling**: Tailwind CSS + styled-components
- **Deployment**: GitHub Actions → iwinv production server

---

HOPEDEN Agricultural Corporation | hopeden.com

## License

MIT — see [LICENSE](./LICENSE).
