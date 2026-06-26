-- ============================================================
-- HopEden Designer — Supabase SQL 스키마
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

-- 확장 활성화
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────
-- 자재 카테고리
-- ──────────────────────────────────────────────────────────
create table if not exists material_categories (
  id          serial primary key,
  code        text unique not null,
  name        text not null,
  sort_order  int default 0
);

-- ──────────────────────────────────────────────────────────
-- 자재 & 가격
-- ──────────────────────────────────────────────────────────
create table if not exists materials (
  id           uuid primary key default uuid_generate_v4(),
  code         text unique not null,
  category_id  int references material_categories(id),
  name         text not null,
  spec         text,
  unit         text default '개',
  unit_price   int not null,
  is_active    boolean default true,
  sort_order   int default 0,
  metadata     jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- 가격 변경 이력
-- ──────────────────────────────────────────────────────────
create table if not exists price_histories (
  id           serial primary key,
  material_id  uuid references materials(id),
  old_price    int not null,
  new_price    int not null,
  changed_by   text not null,
  reason       text,
  created_at   timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- 홉 품종 (종근)
-- ──────────────────────────────────────────────────────────
create table if not exists hop_varieties (
  id                     uuid primary key default uuid_generate_v4(),
  code                   text unique not null,
  name                   text not null,
  name_ko                text,
  characteristics        text,
  unit_price             int not null,
  recommended_spacing_m  float default 1.2,
  is_active              boolean default true,
  is_own_brand           boolean default false
);

-- ──────────────────────────────────────────────────────────
-- 프로젝트
-- ──────────────────────────────────────────────────────────
create table if not exists projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  location    text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- 설계안
-- ──────────────────────────────────────────────────────────
create table if not exists designs (
  id                      uuid primary key default uuid_generate_v4(),
  project_id              uuid references projects(id) on delete cascade,
  name                    text not null,
  version                 int default 1,
  area_m2                 float,
  width_m                 float,
  height_m                float,
  region                  text default 'INLAND',
  pole_code               text,
  row_spacing_m           float default 3.0,
  plant_spacing_m         float default 1.2,
  pole_spacing_m          float default 3.0,
  pole_effective_height_m float default 5.0,
  pole_count              int default 0,
  wire_code               text,
  wire_rows               int default 3,
  wire_length_m           float default 0,
  anchor_code             text,
  anchor_count            int default 0,
  hop_load_kn             float default 0,
  wind_load_kn            float default 0,
  design_tension_kn       float default 0,
  total_estimate          int default 0,
  safety_status           text default 'GREEN',
  include_labor           boolean default true,
  include_vat             boolean default false,
  layout_json             jsonb,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),
  unique (project_id, name, version)
);

-- ──────────────────────────────────────────────────────────
-- updated_at 자동 갱신 트리거
-- ──────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger materials_updated_at before update on materials
  for each row execute function update_updated_at();

create trigger projects_updated_at before update on projects
  for each row execute function update_updated_at();

create trigger designs_updated_at before update on designs
  for each row execute function update_updated_at();

-- ──────────────────────────────────────────────────────────
-- RLS (Row Level Security) 정책
-- ──────────────────────────────────────────────────────────

-- 자재/품종은 누구나 읽기 가능
alter table material_categories enable row level security;
alter table materials enable row level security;
alter table hop_varieties enable row level security;
alter table price_histories enable row level security;

create policy "자재 카테고리 공개 읽기" on material_categories for select using (true);
create policy "자재 공개 읽기" on materials for select using (true);
create policy "품종 공개 읽기" on hop_varieties for select using (true);

-- 프로젝트/설계는 본인만 접근
alter table projects enable row level security;
alter table designs enable row level security;

create policy "프로젝트 본인 접근" on projects
  for all using (auth.uid() = user_id);

create policy "설계 본인 접근" on designs
  for all using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────
-- 시드 데이터
-- ──────────────────────────────────────────────────────────

-- 카테고리
insert into material_categories (code, name, sort_order) values
  ('POLE',   '폴(지주)',    1),
  ('WIRE',   '와이어',      2),
  ('CLIP',   '연결부속',    3),
  ('ANCHOR', '앵커',        4),
  ('LABOR',  '시공비',      5)
on conflict (code) do nothing;

-- 폴
insert into materials (code, category_id, name, spec, unit, unit_price, sort_order, metadata)
select
  m.code, c.id, m.name, m.spec, m.unit, m.unit_price, m.sort_order, m.metadata::jsonb
from (values
  ('POLE_STEEL_60_2T_6M', '강관 60mm 2T × 6m', '아연도금 강관', '개', 35000, 1,
    '{"length_m":6,"diameter_mm":60,"thickness_mm":2,"effective_height_m":5.1,"recommended_spacing_m":3.0,"durability_years":20}'),
  ('POLE_STEEL_60_2T_9M', '강관 60mm 2T × 9m', '특주', '개', 52000, 2,
    '{"length_m":9,"diameter_mm":60,"thickness_mm":2,"effective_height_m":7.5,"recommended_spacing_m":3.0,"durability_years":20}'),
  ('POLE_WOOD_H4_100_6M', '방부목 H4 100×100 × 6m', 'CCA처리', '개', 28000, 3,
    '{"length_m":6,"section_mm":100,"effective_height_m":4.9,"recommended_spacing_m":2.8,"durability_years":12}'),
  ('POLE_WOOD_H4_120_6M', '방부목 H4 120×120 × 6m', 'CCA처리', '개', 38000, 4,
    '{"length_m":6,"section_mm":120,"effective_height_m":4.9,"recommended_spacing_m":2.8,"durability_years":12}'),
  ('POLE_PC_9M',  'PC전봇대 9m',  '중고', '개', 45000, 5,
    '{"length_m":9,"effective_height_m":7.5,"recommended_spacing_m":12.0,"durability_years":30}'),
  ('POLE_PC_12M', 'PC전봇대 12m', '중고', '개', 65000, 6,
    '{"length_m":12,"effective_height_m":10.5,"recommended_spacing_m":12.0,"durability_years":30}')
) as m(code, name, spec, unit, unit_price, sort_order, metadata)
join material_categories c on c.code = 'POLE'
on conflict (code) do nothing;

-- 와이어
insert into materials (code, category_id, name, spec, unit, unit_price, sort_order, metadata)
select
  m.code, c.id, m.name, m.spec, m.unit, m.unit_price, m.sort_order, m.metadata::jsonb
from (values
  ('WIRE_25MM', '스틸와이어 Φ2.5mm', '인장도강', 'm', 380,  1, '{"diameter_mm":2.5,"tensile_strength_kn":15.2}'),
  ('WIRE_32MM', '스틸와이어 Φ3.2mm', '인장도강', 'm', 520,  2, '{"diameter_mm":3.2,"tensile_strength_kn":24.8}'),
  ('WIRE_40MM', '스틸와이어 Φ4.0mm', '인장도강', 'm', 780,  3, '{"diameter_mm":4.0,"tensile_strength_kn":38.6}'),
  ('WIRE_50MM', '스틸와이어 Φ5.0mm', '인장도강', 'm', 1100, 4, '{"diameter_mm":5.0,"tensile_strength_kn":60.4}'),
  ('WIRE_COIR_3MM', '코이어 로프 Φ3mm', '생분해', 'm', 650, 5, '{"diameter_mm":3.0,"tensile_strength_kn":null}')
) as m(code, name, spec, unit, unit_price, sort_order, metadata)
join material_categories c on c.code = 'WIRE'
on conflict (code) do nothing;

-- 앵커
insert into materials (code, category_id, name, spec, unit, unit_price, sort_order)
select m.code, c.id, m.name, m.spec, m.unit, m.unit_price, m.sort_order
from (values
  ('ANCHOR_SCREW_600', '나사말뚝 앵커 L600mm', 'L600mm', '개', 8500,  1),
  ('ANCHOR_SCREW_900', '나사말뚝 앵커 L900mm', 'L900mm', '개', 12000, 2),
  ('ANCHOR_CONCRETE',  '콘크리트 앵커 기초블록', '기초블록', '개', 15000, 3)
) as m(code, name, spec, unit, unit_price, sort_order)
join material_categories c on c.code = 'ANCHOR'
on conflict (code) do nothing;

-- 연결부속
insert into materials (code, category_id, name, spec, unit, unit_price, sort_order)
select m.code, c.id, m.name, m.spec, m.unit, m.unit_price, m.sort_order
from (values
  ('CLIP_U_BOLT',      'U볼트 클램프',  '60mm용', '개', 1200, 1),
  ('CLIP_WIRE_GRIP',   '와이어그립',    '3.2mm용', '개', 800,  2),
  ('CLIP_TURNBUCKLE',  '턴버클',        'M10',    '개', 3500, 3),
  ('EYE_BOLT',         '아이볼트',      'M12',    '개', 2200, 4)
) as m(code, name, spec, unit, unit_price, sort_order)
join material_categories c on c.code = 'CLIP'
on conflict (code) do nothing;

-- 시공비
insert into materials (code, category_id, name, spec, unit, unit_price, sort_order)
select m.code, c.id, m.name, m.spec, m.unit, m.unit_price, m.sort_order
from (values
  ('LABOR_POLE_INSTALL',   '폴 설치',    '굴착·매설·수직도 포함', '개',   12000, 1),
  ('LABOR_WIRE_INSTALL',   '와이어 설치', '인장 조정 포함',        '100m', 35000, 2),
  ('LABOR_ANCHOR_INSTALL', '앵커 설치',  '',                      '개',   8000,  3),
  ('LABOR_RHIZOME_PLANT',  '종근 식재',  '',                      '주',   2500,  4)
) as m(code, name, spec, unit, unit_price, sort_order)
join material_categories c on c.code = 'LABOR'
on conflict (code) do nothing;

-- 홉 품종
insert into hop_varieties (code, name, name_ko, characteristics, unit_price, recommended_spacing_m, is_own_brand)
values
  ('HOP_CASCADE',    'Cascade',    '캐스케이드', '감귤·꽃향, 범용성 최고',       8000,  1.2, false),
  ('HOP_CENTENNIAL', 'Centennial', '센테니얼',   '쓴맛 강함, 맥주 향',           9000,  1.2, false),
  ('HOP_CITRA',      'Citra',      '시트라',     '열대과일향, 고부가가치',        12000, 1.2, false),
  ('HOP_CHINOOK',    'Chinook',    '치누크',     '松향, 극조생',                 9500,  1.2, false),
  ('HOP_FUGGLES',    'Fuggles',    '퍼글스',     '흙향, 전통 에일',              8500,  1.0, false),
  ('HOP_HALLERTAU',  'Hallertau',  '할러타우',   '라거용 귀족홉',                11000, 1.2, false),
  ('HOP_EDEN_01',    '홉이든 1호', '홉이든 1호', '자체 육종, 국내 기후 최적화',  15000, 1.2, true)
on conflict (code) do nothing;
