"use client";

import { useEffect, useState } from "react";

const SCENES = [
  {
    bg: "from-violet-900/95 to-black/95",
    title: "차원에 균열이 일어났다.",
    body: "거실 한가운데서 균열이 갈라지고, 끝없이 몬스터들이 쏟아져 나왔다.",
    emoji: "🌌",
  },
  {
    bg: "from-rose-900/95 to-black/95",
    title: "인류 최후의 희망은 이 부부였다.",
    body: "남편은 망치를 들었고, 아내는 바주카포를 꺼냈다. 잘 안 싸우다가 환장하면 무서운 사람들.",
    emoji: "🧔👰",
  },
  {
    bg: "from-amber-900/95 to-black/95",
    title: "내일도 출근이라 빨리 끝내야 한다.",
    body: "이번 판이 마지막. (방금 전 판도 마지막이었다.)",
    emoji: "⚔️",
  },
];

export function LoreIntro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (i < SCENES.length - 1) {
        setFade(true);
        setTimeout(() => {
          setI(i + 1);
          setFade(false);
        }, 300);
      } else {
        onDone();
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [i, onDone]);

  const s = SCENES[i];
  return (
    <div
      className={`absolute inset-0 z-40 flex items-center justify-center bg-gradient-to-b ${s.bg} p-6 transition-opacity duration-300 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6 animate-pulse">{s.emoji}</div>
        <h2 className="text-2xl font-black text-amber-200 mb-3 drop-shadow-[0_0_10px_rgba(255,200,80,0.4)]">
          {s.title}
        </h2>
        <p className="text-white/80 text-base leading-relaxed">{s.body}</p>
        <button
          onClick={onDone}
          className="mt-8 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white/70 text-sm active:scale-95"
        >
          건너뛰기 ⏭
        </button>
      </div>
    </div>
  );
}
