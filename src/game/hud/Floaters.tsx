"use client";

import { useGame } from "../store";
import { useEffect, useRef } from "react";

export function Floaters() {
  const floaters = useGame((s) => s.floaters);
  return (
    <div className="pointer-events-none absolute inset-0 z-15 overflow-hidden">
      {floaters.map((f) => (
        <FloaterBubble key={f.id} text={f.text} color={f.color} />
      ))}
    </div>
  );
}

function FloaterBubble({ text, color }: { text: string; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.animate(
      [
        { transform: "translate(-50%, 0) scale(0.6)", opacity: 0 },
        { transform: "translate(-50%, -10px) scale(1.0)", opacity: 1, offset: 0.15 },
        { transform: "translate(-50%, -60px) scale(0.9)", opacity: 0 },
      ],
      { duration: 900, easing: "cubic-bezier(.16,.84,.36,1)" }
    );
  }, []);
  return (
    <div
      ref={ref}
      className="absolute left-1/2 top-1/3 -translate-x-1/2 font-black text-lg drop-shadow-[0_0_8px_rgba(0,0,0,0.7)]"
      style={{ color }}
    >
      {text}
    </div>
  );
}
