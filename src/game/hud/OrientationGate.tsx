"use client";

import { useEffect, useState } from "react";

export function OrientationGate() {
  const [portrait, setPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setPortrait(h > w);
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (!portrait || !isMobile) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur grid place-items-center text-center p-6">
      <div className="space-y-3">
        <div className="text-6xl animate-pulse">📱↻</div>
        <h2 className="text-xl font-black text-amber-300">기기를 가로로 돌려주세요</h2>
        <p className="text-white/65 text-sm leading-relaxed">
          이 게임은 가로 모드 전용이에요.<br />
          (몬스터들이 양옆에서 쏟아져 나오거든요.)
        </p>
      </div>
    </div>
  );
}
