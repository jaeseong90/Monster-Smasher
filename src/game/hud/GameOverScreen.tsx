"use client";

import { useEffect, useState } from "react";
import { useGame } from "../store";
import { stopBgm } from "../sounds";
import { useProgression, type Achievement } from "../progression";

export function GameOverScreen() {
  const score = useGame((s) => s.score);
  const wave = useGame((s) => s.wave);
  const kills = useGame((s) => s.monstersKilled);
  const reset = useGame((s) => s.reset);
  const start = useGame((s) => s.start);

  const recordRun = useProgression((s) => s.recordRun);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    stopBgm();
    const granted = recordRun(score, wave, kills);
    setNewAchievements(granted);
  }, [recordRun, score, wave, kills]);

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto overscroll-contain touch-pan-y bg-gradient-to-b from-rose-900/80 to-black/95">
      <div className="min-h-full flex items-start sm:items-center justify-center p-4 pt-safe pb-safe">
        <div className="max-w-md w-full rounded-3xl bg-white/5 border border-white/10 p-6 text-center space-y-4">
        <div className="text-6xl animate-pulse">💀</div>
        <h2 className="text-5xl font-black text-rose-300 drop-shadow-[0_0_20px_rgba(255,60,90,0.5)]">
          KO!
        </h2>
        <p className="text-white/70 text-sm leading-relaxed">
          두 사람 다 뻗어버렸습니다.<br />
          몬스터들이 거실을 점령했네요. 인공호흡 타임!
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="점수" value={score.toLocaleString()} />
          <Stat label="웨이브" value={`${wave}`} />
          <Stat label="처치" value={`${kills}`} />
        </div>
        <Verdict wave={wave} score={score} />
        {newAchievements.length > 0 && (
          <div className="rounded-xl bg-amber-400/10 border border-amber-300/30 p-3 space-y-1.5">
            <div className="text-amber-200 text-xs font-black tracking-widest">🏅 새 도전과제</div>
            {newAchievements.map((a) => (
              <div key={a.id} className="text-left text-sm">
                <div className="text-white font-bold">✨ {a.name}</div>
                <div className="text-white/60 text-xs">{a.desc}</div>
              </div>
            ))}
          </div>
        )}
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

function Verdict({ wave, score }: { wave: number; score: number }) {
  const ranks: { score: number; title: string; sub: string }[] = [
    { score: 0, title: "방어선 무너짐", sub: "그래도 같이 망한 게 어디예요." },
    { score: 200, title: "그럭저럭", sub: "다음 판은 좀 더 진지하게." },
    { score: 600, title: "한 가닥 했네요", sub: "이웃들이 박수쳤어요." },
    { score: 1500, title: "전설의 부부", sub: "옆집까지 몬스터가 도망갔어요." },
    { score: 3500, title: "균열 정복자", sub: "차원의 군주가 사과 편지 보냈음." },
  ];
  const r = ranks.filter((x) => score >= x.score).pop() ?? ranks[0];
  return (
    <div className="rounded-xl bg-amber-400/10 border border-amber-300/30 p-3">
      <div className="text-amber-200 text-xs font-black tracking-widest">평가</div>
      <div className="text-white text-lg font-bold mt-1">{r.title}</div>
      <div className="text-white/60 text-xs mt-0.5 italic">"{r.sub}"</div>
    </div>
  );
}
