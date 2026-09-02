# 🌿 HopEden Designer

> 홉 재배 시설설계 & 비용산출 플랫폼
> 농업회사법인 홉이든

## OpenAI WebMCP Challenge

HopEden Designer is an existing human-operated hopyard planning application being extended during the 2026 OpenAI WebMCP Challenge into a shared human-agent design workspace.

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

ChatGPT's in-app browser supports the required imperative API directly. For Chrome 149+, enable `chrome://flags/#enable-webmcp-testing` and relaunch Chrome.

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

## 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정 (인증·저장 기능 사용 시)
```bash
cp .env.example .env.local
# self-hosted Supabase의 anon/publishable key 입력
```

`/design/demo` 게스트 경로는 Supabase가 없어도 bundled reference catalog로 동작합니다.

### 3. 개발 서버 실행
```bash
npm run dev
# http://localhost:3434
```

---

## 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm test` | 계산·프로파일·WebMCP 계약 테스트 |
| `npm run typecheck` | TypeScript 타입 검사 |

---

## 프로젝트 구조

```
hopeden-designer/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── prices/        # 자재 가격 맵 반환
│   │   └── admin/         # 관리자 CRUD
│   └── (dashboard)/design # 설계 메인 페이지
├── lib/
│   ├── calculations/      # ⭐ 순수 계산 함수
│   │   ├── quantities.ts  #   폴·와이어·종근 수량
│   │   ├── loads.ts       #   홉 하중·풍압 계산
│   │   └── estimate.ts    #   견적 비용 계산
│   ├── supabase/          # Supabase browser/server client
│   └── validators/        # Zod 입력 검증
├── stores/
│   ├── designStore.ts     # 설계 상태 (Zustand)
│   └── priceStore.ts      # 자재 가격 캐시
├── types/index.ts         # 공통 TypeScript 타입
└── supabase/schema.sql    # DB 스키마와 기준 데이터
```

---

## 핵심 원칙

### ⚠️ 가격 하드코딩 절대 금지

```typescript
// ✅ 올바른 방식 — 항상 priceStore 또는 API에서 참조
const { getPrice } = usePriceStore()
const poleCost = getPrice('POLE_STEEL_60_2T_6M') * poleCount

// ❌ 절대 금지
const poleCost = 35000 * poleCount
```

### 계산 로직 분리

모든 수량·하중·비용 계산은 `/lib/calculations/` 의 **순수 함수**로만 작성합니다.  
컴포넌트 내부에 계산 로직을 작성하지 않습니다.

### TypeScript strict 모드

`any` 타입 사용 금지. 모든 타입은 `/types/index.ts` 에서 참조합니다.

---

## 기술 스택

- **Frontend**: Next.js 14 + React 18 + TypeScript (strict)
- **2D**: Konva.js + react-konva
- **3D**: Three.js + @react-three/fiber
- **상태관리**: Zustand
- **DB/Auth**: Supabase
- **스타일**: Tailwind CSS + shadcn/ui
- **배포**: Vercel + Supabase

---

농업회사법인 홉이든 | hopeden.kr

## License

MIT — see [LICENSE](./LICENSE).
