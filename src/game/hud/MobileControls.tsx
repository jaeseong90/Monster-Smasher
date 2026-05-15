"use client";

import { useEffect, useRef, useState } from "react";
import { useInput } from "../input";
import { useGame, WEAPONS } from "../store";
import { useNet } from "../net";

export function MobileControls() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <Joystick />
      <AttackButton />
    </div>
  );
}

function Joystick() {
  const setMove = useInput((s) => s.setMove);
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const baseRef = useRef<{ x: number; y: number } | null>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const pad = padRef.current!;
    const onStart = (e: TouchEvent) => {
      if (touchIdRef.current !== null) return;
      const t = e.changedTouches[0];
      touchIdRef.current = t.identifier;
      const rect = pad.getBoundingClientRect();
      baseRef.current = { x: t.clientX - rect.left, y: t.clientY - rect.top };
      setKnob({ x: 0, y: 0 });
      e.preventDefault();
    };
    const onMove = (e: TouchEvent) => {
      if (touchIdRef.current === null || !baseRef.current) return;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== touchIdRef.current) continue;
        const rect = pad.getBoundingClientRect();
        const dx = t.clientX - rect.left - baseRef.current.x;
        const dy = t.clientY - rect.top - baseRef.current.y;
        const max = 60;
        const mag = Math.hypot(dx, dy);
        const cl = mag > max ? max / mag : 1;
        const px = dx * cl;
        const py = dy * cl;
        setKnob({ x: px, y: py });
        setMove(px / max, py / max);
        e.preventDefault();
      }
    };
    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === touchIdRef.current) {
          touchIdRef.current = null;
          baseRef.current = null;
          setKnob(null);
          setMove(0, 0);
        }
      }
    };
    pad.addEventListener("touchstart", onStart, { passive: false });
    pad.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: false });
    window.addEventListener("touchcancel", onEnd, { passive: false });
    return () => {
      pad.removeEventListener("touchstart", onStart);
      pad.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [setMove]);

  return (
    <div
      ref={padRef}
      className="pointer-events-auto absolute left-0 bottom-0 w-1/2 h-[55%] touch-none"
    >
      {knob && baseRef.current && (
        <>
          <div
            className="absolute rounded-full border-2 border-white/20 bg-white/5"
            style={{
              left: baseRef.current.x - 70,
              top: baseRef.current.y - 70,
              width: 140,
              height: 140,
            }}
          />
          <div
            className="absolute rounded-full bg-white/40 backdrop-blur"
            style={{
              left: baseRef.current.x + knob.x - 30,
              top: baseRef.current.y + knob.y - 30,
              width: 60,
              height: 60,
            }}
          />
        </>
      )}
      <div className="absolute left-5 bottom-5 text-white/40 text-[11px]">조이스틱: 화면 왼쪽을 드래그</div>
    </div>
  );
}

function AttackButton() {
  const setAttack = useInput((s) => s.setAttack);
  const myRole = useNet((s) => s.myRole);
  const husbandWeapon = useGame((s) => s.husbandWeapon);
  const wifeWeapon = useGame((s) => s.wifeWeapon);
  const myWeapon = myRole === "husband" ? husbandWeapon : wifeWeapon;
  const def = WEAPONS[myWeapon];

  return (
    <button
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setAttack(true);
      }}
      onPointerUp={() => setAttack(false)}
      onPointerCancel={() => setAttack(false)}
      onContextMenu={(e) => e.preventDefault()}
      className="pointer-events-auto absolute right-6 bottom-12 w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 border-4 border-rose-200/60 shadow-[0_8px_30px_rgba(255,50,90,0.5)] text-3xl active:scale-90 grid place-items-center"
    >
      <span className="drop-shadow">{def.emoji}</span>
    </button>
  );
}
