"use client";

import { useEffect, useState } from "react";
import { useGame } from "../store";
import { useNet } from "../net";
import { startBgm, stopBgm } from "../sounds";
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
  const [waiting, setWaiting] = useState(false);

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
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-[#190630]/95 to-[#03020a]/95 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-baseline gap-2 mb-2">
            <span className="text-5xl">⚔️</span>
            <h1 className="text-5xl font-black bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(255,150,200,0.3)]">
              MONSTER<br />SMASHER
            </h1>
            <span className="text-5xl">💥</span>
          </div>
          <p className="text-white/70 text-sm mt-2 leading-relaxed">
            화끈한 타격감과 골때리는 물리엔진!<br />
            아내와 함께 몬스터를 날려버려라.
          </p>
          <div className="mt-3 text-[10px] text-white/40 tracking-wider">
            EP. 1 — 거실 균열의 시작
          </div>
        </div>

        {mode === "menu" && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div>
                <label className="text-xs text-white/60">닉네임</label>
                <input
                  value={myName}
                  onChange={(e) => setName(e.target.value.slice(0, 12))}
                  className="w-full mt-1 bg-black/30 border border-white/15 rounded-lg px-3 py-2 text-white"
                  placeholder="플레이어"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">역할</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setRole("husband")}
                    className={`rounded-lg py-3 border ${
                      myRole === "husband"
                        ? "bg-blue-500/30 border-blue-400 text-white"
                        : "bg-black/30 border-white/15 text-white/70"
                    }`}
                  >
                    🧔 남편 (근접)
                  </button>
                  <button
                    onClick={() => setRole("wife")}
                    className={`rounded-lg py-3 border ${
                      myRole === "wife"
                        ? "bg-pink-500/30 border-pink-400 text-white"
                        : "bg-black/30 border-white/15 text-white/70"
                    }`}
                  >
                    👰 아내 (원거리)
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                const c = genCode();
                setMode("host");
                setWaiting(true);
                await hostRoom(c);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-400 text-black font-black text-lg active:scale-95 shadow-lg"
            >
              🏠 방 만들기
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full py-4 rounded-2xl bg-white/10 border border-white/15 text-white font-bold active:scale-95"
            >
              🚪 방 참가하기
            </button>
            <button
              onClick={() => start()}
              className="w-full py-3 rounded-2xl bg-black/30 border border-white/10 text-white/70 font-medium active:scale-95"
            >
              혼자 연습하기
            </button>
          </div>
        )}

        {mode === "host" && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center space-y-4">
            <div className="text-white/70 text-sm">방 코드를 상대방에게 알려주세요</div>
            <div className="text-6xl font-mono font-black tracking-widest text-amber-300 drop-shadow-[0_0_20px_rgba(255,200,80,0.4)]">
              {code}
            </div>
            <div className="text-xs text-white/50">
              {enabled
                ? connected
                  ? remote
                    ? "✅ 상대 입장 완료!"
                    : "⏳ 상대 대기중…"
                  : "🔌 서버 연결중…"
                : "⚠️ Supabase 설정 없음 — 싱글로 진행"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMode("menu");
                  setWaiting(false);
                  useNet.getState().leave();
                }}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white border border-white/15 active:scale-95"
              >
                뒤로
              </button>
              <button
                onClick={() => start()}
                className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-bold active:scale-95"
              >
                시작!
              </button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
            <div>
              <label className="text-xs text-white/60">방 코드 (4자리)</label>
              <input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                className="w-full mt-1 bg-black/40 border border-white/15 rounded-xl px-4 py-4 text-3xl font-mono tracking-widest text-center text-amber-300"
              />
            </div>
            <div className="text-xs text-white/50 text-center">
              {enabled
                ? connected
                  ? "✅ 입장 완료. 시작 버튼을 눌러주세요"
                  : "🔌 서버 연결중…"
                : "Supabase 환경변수가 없으면 싱글 모드"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("menu")}
                className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 text-white active:scale-95"
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
                className="flex-1 py-3 rounded-xl bg-pink-400 text-black font-bold active:scale-95 disabled:opacity-50"
              >
                참가
              </button>
            </div>
          </div>
        )}

        {(bestScore > 0 || bestWave > 0) && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-white/5 border border-white/10 py-2">
              <div className="text-[10px] uppercase text-white/50 tracking-widest">최고 점수</div>
              <div className="text-amber-300 font-bold text-lg tabular-nums">{bestScore.toLocaleString()}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 py-2">
              <div className="text-[10px] uppercase text-white/50 tracking-widest">최고 웨이브</div>
              <div className="text-pink-300 font-bold text-lg tabular-nums">{bestWave}</div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-white/40 text-[11px] leading-5">
          모바일 가로모드 추천 · 좌측 드래그 이동 · 우측 버튼 공격<br />
          PC: WASD/방향키 · Space 공격 · 1~4 무기 변경 · P 디버그
        </div>
      </div>
    </div>
  );
}
