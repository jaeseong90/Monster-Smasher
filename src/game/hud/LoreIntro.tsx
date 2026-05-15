"use client";

import { useEffect, useRef, useState } from "react";

interface Scene {
  tint: string;
  spotlight: string;
  title: string;
  body: string;
  emoji: string;
}

const SCENES: Scene[] = [
  {
    tint: "from-violet-950 via-purple-950/80 to-black",
    spotlight: "from-violet-500/30",
    title: "차원에 균열이 일어났다.",
    body: "거실 한가운데서 균열이 갈라지고, 끝없이 몬스터들이 쏟아져 나왔다.",
    emoji: "🌌",
  },
  {
    tint: "from-rose-950 via-pink-950/80 to-black",
    spotlight: "from-rose-500/30",
    title: "인류 최후의 희망은 이 부부였다.",
    body: "남편은 망치를 들었고, 아내는 바주카포를 꺼냈다.\n잘 안 싸우다가 환장하면 무서운 사람들.",
    emoji: "🧔👰",
  },
  {
    tint: "from-amber-950 via-orange-950/80 to-black",
    spotlight: "from-amber-500/30",
    title: "내일도 출근이다.",
    body: "빨리 끝내야 한다.\n이번 판이 마지막. (방금 전 판도 마지막이었다.)",
    emoji: "⚔️",
  },
];

const SCENE_DURATION = 2600;

export function LoreIntro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"enter" | "hold" | "leave">("enter");
  const doneRef = useRef(false);

  useEffect(() => {
    const enter = setTimeout(() => setPhase("hold"), 60);
    const leave = setTimeout(() => setPhase("leave"), SCENE_DURATION - 350);
    const next = setTimeout(() => {
      if (i < SCENES.length - 1) {
        setI(i + 1);
        setPhase("enter");
      } else if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, SCENE_DURATION);
    return () => {
      clearTimeout(enter);
      clearTimeout(leave);
      clearTimeout(next);
    };
  }, [i, onDone]);

  const skip = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  const s = SCENES[i];
  const animOpacity = phase === "hold" ? "opacity-100" : "opacity-0";
  const animTranslate = phase === "enter" ? "translate-y-3" : phase === "leave" ? "-translate-y-2" : "translate-y-0";

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-black">
      <div className={`absolute inset-0 bg-gradient-to-b ${s.tint} transition-[background-color,background-image] duration-500`} />
      <div
        className={`absolute inset-0 bg-gradient-radial ${s.spotlight} via-transparent to-transparent opacity-80`}
        style={{
          background: `radial-gradient(80% 55% at 50% 45%, ${s.spotlight.includes("violet") ? "rgba(167,84,255,0.35)" : s.spotlight.includes("rose") ? "rgba(255,90,160,0.32)" : "rgba(255,180,90,0.32)"} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent z-10" />

      <div className="relative h-full w-full flex items-center justify-center p-8">
        <div
          className={`max-w-md text-center transition-all duration-500 ${animOpacity} ${animTranslate}`}
        >
          <div className="text-7xl mb-7 drop-shadow-[0_0_40px_rgba(255,200,140,0.3)] animate-[float_3s_ease-in-out_infinite]">
            {s.emoji}
          </div>
          <div className="mb-4 text-[10px] tracking-[0.45em] uppercase text-amber-200/55">
            Prologue · {String(i + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
          </div>
          <h2 className="text-3xl font-black text-amber-100 mb-4 drop-shadow-[0_0_24px_rgba(255,200,80,0.45)]">
            {s.title}
          </h2>
          <p className="text-white/80 text-[15px] leading-relaxed whitespace-pre-line">
            {s.body}
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
        {SCENES.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === i ? "w-8 bg-amber-300" : idx < i ? "w-1.5 bg-amber-300/40" : "w-1.5 bg-white/15"
            }`}
          />
        ))}
      </div>

      <button
        onClick={skip}
        className="absolute top-6 right-6 px-4 py-2 rounded-full bg-white/5 border border-white/15 text-white/55 hover:text-white text-xs tracking-wider active:scale-95 z-20 backdrop-blur"
      >
        SKIP ⏭
      </button>

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
