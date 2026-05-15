"use client";

import { useEffect, useState } from "react";
import { useGame } from "../store";
import { useNet } from "../net";
import { startBgm } from "../sounds";
import { useProgression } from "../progression";

export function TitleScreen() {
  const start = useGame((s) => s.start);
  const setName = useNet((s) => s.setName);
  const setRole = useNet((s) => s.setRole);
  const myName = useNet((s) => s.myName);
  const myRole = useNet((s) => s.myRole);
  const hostRoom = useNet((s) => s.hostRoom);
  const joinRoom = useNet((s) => s.joinRoom);
  const enabled = useNet((s) => s.enabled);
  const connected = useNet((s) => s.connected);
  const remote = useNet((s) => s.remote);

  const [mode, setMode] = useState<"menu" | "host" | "join">("menu");
  const [code, setCode] = useState("");

  const load = useProgression((s) => s.load);
  const bestScore = useProgression((s) => s.bestScore);
  const bestWave = useProgression((s) => s.bestWave);

  useEffect(() => {
    const saved = localStorage.getItem("ms-name");
    if (saved) setName(saved);
    const role = (localStorage.getItem("ms-role") as "husband" | "wife") || "husband";
    setRole(role);
    load();
  }, [setName, setRole, load]);

  useEffect(() => {
    if (myName) localStorage.setItem("ms-name", myName);
    localStorage.setItem("ms-role", myRole);
  }, [myName, myRole]);

  useEffect(() => {
    const fn = () => {
      startBgm();
      window.removeEventListener("pointerdown", fn);
    };
    window.addEventListener("pointerdown", fn, { once: true });
    return () => window.removeEventListener("pointerdown", fn);
  }, []);

  function genCode() {
    const c = Math.floor(1000 + Math.random() * 9000).toString();
    setCode(c);
    return c;
  }

  return (
    <div className="absolute inset-0 z-30 overflow-hidden">
      <AtmosphereLayer />

      <div className="relative h-full w-full overflow-y-auto overscroll-contain touch-pan-y flex items-start sm:items-center justify-center p-4 pt-safe pb-safe">
        <div className="max-w-md w-full">
          <header className="text-center mb-7">
            <div className="text-[10px] tracking-[0.45em] text-amber-200/70 mb-3 uppercase">
              Cooperative Physics Mayhem
            </div>
            <h1 className="relative leading-[0.95]">
              <span className="block text-[64px] font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-rose-300 to-fuchsia-400 drop-shadow-[0_0_28px_rgba(255,120,180,0.45)]">
                MONSTER
              </span>
              <span className="block text-[64px] font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-200 via-sky-300 to-violet-400 drop-shadow-[0_0_24px_rgba(120,200,255,0.45)] -mt-3">
                SMASHER
              </span>
              <span className="absolute -top-2 -left-3 text-3xl rotate-[-15deg] drop-shadow-[0_0_18px_rgba(255,180,80,0.6)]">⚔️</span>
              <span className="absolute -bottom-2 -right-2 text-3xl rotate-[15deg] drop-shadow-[0_0_18px_rgba(255,80,120,0.6)]">💥</span>
            </h1>
            <p className="text-white/65 text-sm mt-5 leading-relaxed">
              화끈한 타격감과 골때리는 물리엔진<br />
              <span className="text-white/45">아내와 함께 균열 너머의 몬스터를 박살내라.</span>
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-[10px] text-amber-200/55 tracking-[0.3em] uppercase">
              <span className="h-px w-6 bg-amber-200/30" />
              Ep. 1 — 거실 균열의 시작
              <span className="h-px w-6 bg-amber-200/30" />
            </div>
          </header>

          {mode === "menu" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-xl p-4 space-y-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/45">닉네임</label>
                  <input
                    value={myName}
                    onChange={(e) => setName(e.target.value.slice(0, 12))}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:border-amber-300/60 outline-none transition"
                    placeholder="플레이어"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/45">역할</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <RoleButton
                      active={myRole === "husband"}
                      onClick={() => setRole("husband")}
                      accent="from-sky-400/30 to-blue-600/30"
                      ring="ring-sky-400/60"
                      emoji="🧔"
                      label="남편"
                      sub="근접 깡패"
                    />
                    <RoleButton
                      active={myRole === "wife"}
                      onClick={() => setRole("wife")}
                      accent="from-rose-400/30 to-fuchsia-600/30"
                      ring="ring-rose-400/60"
                      emoji="👰"
                      label="아내"
                      sub="화력 덕후"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  const c = genCode();
                  setMode("host");
                  await hostRoom(c);
                }}
                className="group relative w-full py-4 rounded-2xl overflow-hidden font-black text-lg active:scale-[0.98] transition shadow-[0_18px_38px_-10px_rgba(255,150,80,0.55)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-amber-300 via-rose-300 to-fuchsia-400" />
                <span className="absolute inset-0 bg-gradient-to-r from-amber-200 via-rose-200 to-fuchsia-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative text-black flex items-center justify-center gap-2 tracking-tight">
                  <span>🏠</span> 방 만들기 <span className="text-xs font-bold opacity-70">— 호스트</span>
                </span>
              </button>

              <button
                onClick={() => setMode("join")}
                className="group w-full py-4 rounded-2xl bg-white/[0.06] border border-white/15 text-white font-bold active:scale-[0.98] transition flex items-center justify-center gap-2 hover:bg-white/[0.1]"
              >
                <span>🚪</span> 방 참가하기 <span className="text-xs font-normal text-white/50">— 코드 입력</span>
              </button>

              <button
                onClick={() => start()}
                className="w-full py-2.5 rounded-2xl bg-transparent text-white/55 text-sm active:scale-[0.98] hover:text-white/80 transition"
              >
                ↳ 혼자 연습하기
              </button>
            </div>
          )}

          {mode === "host" && (
            <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 backdrop-blur-xl p-7 text-center space-y-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
              <div className="text-[10px] uppercase tracking-[0.35em] text-amber-200/65">Room Code</div>
              <div className="relative">
                <div className="text-7xl font-mono font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-400 drop-shadow-[0_0_30px_rgba(255,200,80,0.45)]">
                  {code}
                </div>
                <div className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
              </div>
              <ConnectStatus enabled={enabled} connected={connected} hasRemote={!!remote} role="host" />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMode("menu");
                    useNet.getState().leave();
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/[0.06] text-white border border-white/15 active:scale-95"
                >
                  뒤로
                </button>
                <button
                  onClick={() => start()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-300 to-rose-300 text-black font-black active:scale-95 shadow-lg"
                >
                  시작
                </button>
              </div>
            </div>
          )}

          {mode === "join" && (
            <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 backdrop-blur-xl p-7 space-y-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.35em] text-rose-200/65 mb-3">Enter Room Code</div>
                <input
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="0000"
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-4 text-4xl font-mono tracking-[0.4em] text-center text-rose-200 outline-none focus:border-rose-300/60 transition placeholder:text-white/15"
                />
              </div>
              <ConnectStatus enabled={enabled} connected={connected} hasRemote={false} role="join" />
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("menu")}
                  className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/15 text-white active:scale-95"
                >
                  뒤로
                </button>
                <button
                  onClick={async () => {
                    if (code.length !== 4) return;
                    await joinRoom(code);
                    start();
                  }}
                  disabled={code.length !== 4}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-300 to-fuchsia-400 text-black font-black active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                >
                  참가
                </button>
              </div>
            </div>
          )}

          {(bestScore > 0 || bestWave > 0) && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <StatChip label="최고 점수" value={bestScore.toLocaleString()} color="text-amber-200" />
              <StatChip label="최고 웨이브" value={String(bestWave)} color="text-rose-200" />
            </div>
          )}

          <div className="mt-6 text-center text-white/35 text-[11px] leading-5 px-4">
            모바일 가로모드 · 좌측 드래그 이동 · 우측 버튼 공격<br />
            <span className="text-white/25">PC: WASD · Space · 1~4 · P</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleButton({
  active,
  onClick,
  accent,
  ring,
  emoji,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  accent: string;
  ring: string;
  emoji: string;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl p-2.5 border transition active:scale-95 ${
        active
          ? `bg-gradient-to-br ${accent} border-white/30 ring-2 ${ring} text-white`
          : "bg-black/30 border-white/10 text-white/55 hover:text-white/80"
      }`}
    >
      <div className="text-2xl leading-none mb-0.5">{emoji}</div>
      <div className="font-black text-sm leading-tight">{label}</div>
      <div className={`text-[10px] mt-0.5 ${active ? "text-white/80" : "text-white/35"}`}>{sub}</div>
    </button>
  );
}

function ConnectStatus({
  enabled,
  connected,
  hasRemote,
  role,
}: {
  enabled: boolean;
  connected: boolean;
  hasRemote: boolean;
  role: "host" | "join";
}) {
  let label = "";
  let dot = "bg-amber-300";
  if (!enabled) {
    label = "Supabase 설정 없음 — 싱글 진행";
    dot = "bg-zinc-500";
  } else if (!connected) {
    label = "서버 연결중…";
    dot = "bg-amber-300 animate-pulse";
  } else if (role === "host") {
    label = hasRemote ? "상대 입장 완료" : "상대 대기중…";
    dot = hasRemote ? "bg-emerald-300" : "bg-amber-300 animate-pulse";
  } else {
    label = "입장 완료 — 시작 버튼을 눌러주세요";
    dot = "bg-emerald-300";
  }
  return (
    <div className="flex items-center justify-center gap-2 text-[11px] text-white/60">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur py-2 text-center">
      <div className="text-[9px] uppercase tracking-[0.25em] text-white/40">{label}</div>
      <div className={`font-black text-lg tabular-nums ${color} drop-shadow-[0_0_10px_currentColor] mt-0.5`}>{value}</div>
    </div>
  );
}

function AtmosphereLayer() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(76,16,90,0.7)_0%,rgba(8,4,18,0.95)_55%,#03020a_100%)]" />
      <div
        className="absolute inset-0 opacity-60 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, rgba(255,90,180,0.22), transparent 40%), radial-gradient(circle at 80% 70%, rgba(60,200,255,0.18), transparent 45%), radial-gradient(circle at 50% 100%, rgba(255,200,80,0.18), transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      <FloatingSparks />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
    </>
  );
}

function FloatingSparks() {
  const items = Array.from({ length: 22 }).map((_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((i) => {
        const left = (i * 37) % 100;
        const delay = (i * 0.7) % 7;
        const dur = 8 + (i % 5);
        const size = 2 + (i % 3);
        const color = i % 3 === 0 ? "#ff7ec1" : i % 3 === 1 ? "#6cf0ff" : "#ffd76a";
        return (
          <span
            key={i}
            className="absolute rounded-full opacity-0"
            style={{
              left: `${left}%`,
              bottom: "-8px",
              width: size,
              height: size,
              background: color,
              boxShadow: `0 0 ${size * 4}px ${color}`,
              animation: `spark-rise ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes spark-rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.85; }
          50% { transform: translateY(-60vh) translateX(20px); opacity: 0.65; }
          100% { transform: translateY(-120vh) translateX(-10px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
