# ⚔️ Monster Smasher

> 화끈한 타격감과 골때리는 물리엔진. 부부가 서로 다른 폰으로 실시간 듀오 액션.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-v8-61dafb?logo=three.js&logoColor=white)](https://docs.pmnd.rs/react-three-fiber)
[![Rapier](https://img.shields.io/badge/Rapier-WASM-ff6b6b)](https://rapier.rs/)
[![Supabase Realtime](https://img.shields.io/badge/Supabase-Realtime-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/realtime)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**🎮 라이브 데모:** **[monster-smasher.vercel.app](https://monster-smasher.vercel.app/)** · **📱 모바일 가로모드 권장**

[![Open Demo](https://img.shields.io/badge/▶_Play_Now-monster--smasher.vercel.app-ff5cbd?style=for-the-badge)](https://monster-smasher.vercel.app/)

<!-- TODO: gameplay.gif 또는 hero screenshot 자리. /docs/hero.png 같은 경로 추천 -->

---

## 이 프로젝트로 보여주는 것

> 짧은 시간(주말 프로토타입) 안에 **3D 게임 풀스택**을 어디까지 끌고 갈 수 있는지 시험한 프로젝트.

- **3D 렌더 파이프라인** — React Three Fiber에 ACES 톤매핑·Bloom·Vignette·Chromatic Aberration 후처리, HDRI Environment, ContactShadows, 컬러 림라이트 3-포인트 조명 직접 셋업.
- **WASM 물리 엔진** — `@react-three/rapier`로 임펄스 기반 넉백, 폭발 블래스트, 환경 헤저드(톱날·가시) 충돌 처리.
- **실시간 멀티플레이** — Supabase Realtime의 Broadcast/Presence 채널로 P2P 룸. 호스트가 월드 시뮬레이션 권위를 가지고 클라이언트가 입력만 송신하는 단순화된 권위 모델.
- **상태관리 아키텍처** — Zustand 스토어를 도메인별(`useGame` 게임 상태 / `useNet` 네트 / `useInput` 입력 / `useProgression` 영속 진행도)로 분리, 컴포넌트는 selector로 슬라이스만 구독.
- **모바일 우선 UX** — `dvh` + `env(safe-area-inset-*)`, 가상 조이스틱·공격 버튼, 가로모드 강제 게이트, PWA 매니페스트.
- **프로시저럴 캐릭터 모션** — 스켈레탈 애니메이션 없이 sin 기반 walk-bob, lean, attack-lunge, vertical squash로 정적인 인상 제거.
- **로컬 영속화** — `localStorage` 기반 진행도(무기 언락, 업적, 최고 기록).

## 세계관

> 세상은 멸망 직전. 차원의 균열에서 끝없이 쏟아져 나오는 **고무찰흙 몬스터 군단**이 도시를 박살내고 있다.
> 인류의 마지막 희망은 잘 안 싸우다가 갑자기 환장하면 무서운 부부 — **남편(근접 깡패)** 과 **아내(화력 덕후)**.
> 이들은 오늘도 거실에서 시작해 우주의 끝까지 몬스터들을 와장창 날려버리러 떠난다.

## 핵심 액션

- **물리 엔진 기반 넉백** — 모든 타격은 임펄스, 몬스터들이 볼링핀처럼 날아감.
- **회전 톱날 / 가시 함정** — 환경을 활용한 환경킬.
- **연쇄 폭발** — 바주카포 폭발은 주변 몬스터 + 아군까지 휘말림.
- **콤보 시스템** — 연속 처치 가산점 + 부부 거리 ×1.5 보너스.
- **보스 라운드** — 일정 웨이브마다 거대 보스 + 보스 처치 후 가사 PvP 미니라운드.

## 무기 라인업

### 🧔 남편 (근접)
| 무기 | 성능 |
|---|---|
| 🔨 거대 망치 | 데미지 ↑↑, 강한 넉백 |
| 🗡️ 대검 | 긴 사거리, 빠른 공속 |
| 🍳 거대 프라이팬 | 광역 깡통 사운드, 폭발적 넉백 |
| 🛠️ 뿅망치 | 데미지 ↓, 어마무시한 넉백 |

### 👰 아내 (원거리/화력)
| 무기 | 성능 |
|---|---|
| 🚀 바주카포 | 폭발 광역, 남편도 휘말림 |
| 🔥 화염방사기 | 지속 대미지 콘 |
| 🌱 대파 | 빠른 휘두름, 가성비 |
| 🛠️ 뿅망치 | 자기방어용 |

## 멀티플레이

서로 다른 기기에서 실시간 듀오.

1. 한 명이 **🏠 방 만들기** → 4자리 코드 생성
2. 다른 한 명이 **🚪 방 참가하기** → 코드 입력
3. 함께 같은 아레나에 입장, 같은 시드의 월드를 공유

호스트가 월드/몬스터 시뮬레이션을 담당하고, 양쪽 모두 자기 캐릭터 입력만 송신합니다. 통신은 Supabase Realtime Broadcast 채널.

## 조작법

| 플랫폼 | 이동 | 공격 | 무기 |
|---|---|---|---|
| 📱 모바일 | 좌측 가상 조이스틱 | 우측 큰 버튼 | 상단 슬롯 탭 |
| 🖥️ PC | `WASD` / 방향키 | `Space` | `1` ~ `4` |

`P` — 물리 디버그 토글.

## 로컬 실행

```bash
npm install
npm run dev
```

### 멀티플레이 활성화 (선택)

`.env.local`에 Supabase 환경변수를 넣으면 자동 활성화됩니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

환경변수가 없으면 자동으로 싱글 플레이로 폴백합니다. **`anon` 키만 사용하며 RLS 우려가 없는 영역**(Realtime 채널만)에서 동작합니다.

## 배포

`main` 브랜치 푸시시 [Vercel](https://vercel.com)이 자동 빌드·배포합니다 → [monster-smasher.vercel.app](https://monster-smasher.vercel.app/).

## 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 14.2 (App Router) |
| 3D 렌더 | React Three Fiber 8.x, three.js 0.169 |
| 후처리 | @react-three/postprocessing (ACES, Bloom, Vignette, CA) |
| 물리 | @react-three/rapier (WASM) |
| 멀티플레이 | Supabase Realtime (Broadcast + Presence) |
| 상태 | Zustand |
| 스타일 | Tailwind CSS |
| 배포 | Vercel |

## 디렉토리 구조

```
app/                 Next.js App Router (page, layout, globals)
src/game/
├── Game.tsx         Canvas 셋업 + 톤매핑/exposure + 오버레이 라우팅
├── Scene.tsx        조명·환경맵·카메라·셰이크
├── FX.tsx           포스트프로세싱 파이프라인
├── store.ts         게임 상태 (Zustand)
├── net.ts           Supabase Realtime 멀티
├── input.ts         키보드/조이스틱 입력
├── progression.ts   localStorage 영속 진행도
├── camera.ts        화면 셰이크 버스
├── sounds.ts        SFX/BGM
├── world/           Arena, Hazards, Skybox
├── entities/        Character, LocalPlayer, RemotePlayer, MonsterManager, Attacks, Drops, ChoreChest, AttackBus
└── hud/             HUD, MobileControls, TitleScreen, GameOverScreen, LoreIntro, BiomeBanner, ChoreOverlay, OrientationGate
```

## 한계 / 알려진 사항

- 캐릭터/몬스터가 외부 3D 에셋 없이 primitive 도형(캡슐+구체+박스)으로 구성 — 후처리로 보강하지만 본격 게임의 비주얼 천장은 명확.
- 호스트 권위 모델이라 호스트가 끊기면 룸이 무너짐 (재연결 로직 없음).
- 모바일 가로모드 전용.

## 라이선스

MIT. 만든 사람의 의도는 부부 둘이 퇴근하고 스트레스 풀기. 마음대로 가져다 쓰시고 PR 환영.

🧔 + 👰 = 💥
