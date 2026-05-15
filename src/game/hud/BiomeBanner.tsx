"use client";

import { useEffect, useState } from "react";
import { useGame } from "../store";

const BIOMES = [
  { name: "거실", desc: "균열이 시작된 곳" },
  { name: "옥상", desc: "도시의 끝" },
  { name: "지하 던전", desc: "이끼와 함정 사이로" },
  { name: "우주 정거장", desc: "무중력 전선" },
  { name: "시댁", desc: "가장 위험한 던전" },
  { name: "균열의 끝", desc: "최후의 결전" },
];

export function BiomeBanner() {
  const wave = useGame((s) => s.wave);
  const [show, setShow] = useState<{ name: string; desc: string; wave: number } | null>(null);

  useEffect(() => {
    const idx = Math.min(BIOMES.length - 1, Math.floor((wave - 1) / 2));
    const b = BIOMES[idx];
    setShow({ ...b, wave });
    const t = setTimeout(() => setShow(null), 2200);
    return () => clearTimeout(t);
  }, [wave]);

  if (!show) return null;
  return (
    <div
      key={show.wave}
      className="pointer-events-none absolute top-[28%] left-1/2 -translate-x-1/2 z-20 text-center animate-[bannerIn_2.2s_ease-out_forwards]"
    >
      <div className="text-[10px] tracking-[0.55em] text-amber-300/85 uppercase">
        Wave {String(show.wave).padStart(2, "0")}
      </div>
      <div className="relative mt-1">
        <div className="text-5xl font-black bg-gradient-to-br from-amber-100 via-amber-200 to-rose-200 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(255,200,80,0.55)]">
          {show.name}
        </div>
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 h-px w-32 bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
      </div>
      <div className="text-[13px] text-white/60 mt-4 italic tracking-wide">{show.desc}</div>
      <style>{`
        @keyframes bannerIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.96); }
          12% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          80% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.98); }
        }
      `}</style>
    </div>
  );
}
