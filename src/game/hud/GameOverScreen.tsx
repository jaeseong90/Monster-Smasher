"use client";

import { useGame } from "../store";

export function GameOverScreen() {
  const score = useGame((s) => s.score);
  const wave = useGame((s) => s.wave);
  const kills = useGame((s) => s.monstersKilled);
  const reset = useGame((s) => s.reset);
  const start = useGame((s) => s.start);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-rose-900/80 to-black/95 p-4">
      <div className="max-w-md w-full rounded-3xl bg-white/5 border border-white/10 p-6 text-center space-y-4">
        <div className="text-6xl">💀</div>
        <h2 className="text-4xl font-black text-rose-300">
          KO!
        </h2>
        <p className="text-white/70 text-sm">두 사람 다 뻗어버렸습니다. 인공호흡 시간!</p>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="점수" value={score.toLocaleString()} />
          <Stat label="웨이브" value={`${wave}`} />
          <Stat label="처치" value={`${kills}`} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={start}
            className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-bold active:scale-95"
          >
            다시 도전
          </button>
          <button
            onClick={reset}
            className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 text-white active:scale-95"
          >
            메뉴로
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/10 p-3">
      <div className="text-[10px] text-white/50 uppercase tracking-widest">{label}</div>
      <div className="text-amber-300 font-bold text-lg tabular-nums">{value}</div>
    </div>
  );
}
