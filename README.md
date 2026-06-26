# 🌿 HopEden Designer

> 홉 재배 시설설계 & 비용산출 플랫폼
> 농업회사법인 홉이든

---

## 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local을 열어 DB URL, Auth 시크릿 등 입력
```

### 3. DB 초기화 & 시드 데이터 삽입
```bash
# 스키마 적용
npm run db:push

# 초기 자재 가격 데이터 삽입
npm run db:seed
```

### 4. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000
```

---

## 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run db:seed` | 시드 데이터 삽입 |
| `npm run db:studio` | Prisma Studio (DB GUI) |
| `npm run db:reset` | DB 초기화 + 시드 재삽입 |

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
│   ├── db/prisma.ts       # Prisma 싱글톤
│   └── validators/        # Zod 입력 검증
├── stores/
│   ├── designStore.ts     # 설계 상태 (Zustand)
│   └── priceStore.ts      # 자재 가격 캐시
├── types/index.ts         # 공통 TypeScript 타입
└── prisma/
    ├── schema.prisma      # DB 스키마
    └── seed.ts            # 초기 데이터
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
- **DB**: PostgreSQL + Prisma ORM
- **스타일**: Tailwind CSS + shadcn/ui
- **배포**: Vercel + Supabase

---

농업회사법인 홉이든 | hopeden.kr
