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
    <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 z-20 text-center">
      <div className="text-xs tracking-[0.4em] text-amber-300/90 uppercase">웨이브 {show.wave}</div>
      <div className="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(255,200,80,0.5)] mt-1">
        {show.name}
      </div>
      <div className="text-sm text-white/60 mt-1 italic">{show.desc}</div>
    </div>
  );
}
