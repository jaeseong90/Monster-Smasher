"use client";

import { useEffect, useState } from "react";
import { useGame } from "../store";
import { useNet } from "../net";

export function ChoreOverlay() {
  const status = useGame((s) => s.status);
  const winner = useGame((s) => s.choreWinner);
  const myRole = useNet((s) => s.myRole);
  const nextWave = useGame((s) => s.nextWave);
  const setStatus = useGame((s) => s.setStatus);
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (status !== "chore-pvp") return;
    setCount(3);
    const i = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(i);
          return 0;
        }
        return c - 1;
      });
    }, 800);
    return () => clearInterval(i);
  }, [status]);

  if (status === "chore-pvp" && count > 0) {
    return (
      <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/40">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.4em] text-amber-300">설거지 면제 PvP</div>
          <div className="text-9xl font-black text-rose-300 animate-pulse drop-shadow-[0_0_30px_rgba(255,80,150,0.5)]">
            {count}
          </div>
          <div className="text-white/80 text-sm mt-4">상대를 패서 상자를 차지하라!</div>
        </div>
      </div>
    );
  }

  if (status === "chore-result" && winner) {
    const iWon = winner === myRole;
    return (
      <div className="absolute inset-0 z-30 overflow-y-auto overscroll-contain touch-pan-y bg-gradient-to-b from-amber-900/85 to-black/95">
        <div className="min-h-full flex items-center justify-center p-4 pt-safe pb-safe">
          <div className="max-w-md w-full rounded-3xl bg-white/5 border border-white/10 p-6 text-center space-y-3">
            <div className="text-6xl">{iWon ? "🏆" : "🧽"}</div>
            <h2 className="text-3xl font-black text-amber-300">
              {iWon ? "설거지 면제!" : "오늘은 설거지…"}
            </h2>
            <p className="text-white/75 text-sm">
              {iWon
                ? "공식 인증. 보너스 라운드 보상도 챙기세요."
                : `${winner === "husband" ? "남편" : "아내"}님이 상자를 차지했습니다.`}
            </p>
            <button
              onClick={() => {
                nextWave();
                setStatus("playing");
              }}
              className="w-full py-3 rounded-xl bg-amber-400 text-black font-bold active:scale-95 mt-2"
            >
              계속하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "chore-pvp" && count === 0) {
    return (
      <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-25 bg-rose-500/90 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(255,80,140,0.6)]">
        설거지 면제 PvP — 상자를 차지하라
      </div>
    );
  }
  return null;
}
