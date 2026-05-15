"use client";

import { useEffect, useState } from "react";
import { useGame } from "../store";

export function OnboardingHint() {
  const wave = useGame((s) => s.wave);
  const status = useGame((s) => s.status);
  const [phase, setPhase] = useState<"ready" | "go" | "hint" | "done">("ready");

  useEffect(() => {
    if (status !== "playing" || wave !== 1) {
      setPhase("done");
      return;
    }
    setPhase("ready");
    const t1 = setTimeout(() => setPhase("go"), 900);
    const t2 = setTimeout(() => setPhase("hint"), 1700);
    const t3 = setTimeout(() => setPhase("done"), 6800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [wave, status]);

  if (phase === "done") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {(phase === "ready" || phase === "go") && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div
              key={phase}
              className={`text-[88px] font-black tracking-wider drop-shadow-[0_0_40px_rgba(255,200,80,0.55)] ${
                phase === "ready"
                  ? "text-amber-200 animate-[zoomFadeOut_0.9s_ease-out_forwards]"
                  : "text-rose-300 animate-[zoomFlash_0.8s_ease-out_forwards]"
              }`}
            >
              {phase === "ready" ? "READY…" : "FIGHT!"}
            </div>
          </div>
        </div>
      )}

      {phase === "hint" && (
        <div className="absolute inset-0 flex items-end justify-center pb-[20%] sm:pb-[12%] animate-[fadeIn_0.4s_ease-out]">
          <div className="bg-black/55 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-4 flex flex-col gap-2.5 max-w-[88vw] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.6)]">
            <Row icon="🕹️" text="좌측 화면 드래그로 이동" />
            <Row icon="🔴" text="우측 빨간 버튼으로 공격" />
            <Row icon="🎯" text="상단 슬롯으로 무기 변경" />
            <Row icon="💎" text="드롭템을 주워 회복·점수 챙기기" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes zoomFadeOut {
          0% { opacity: 0; transform: scale(1.2); }
          15% { opacity: 1; transform: scale(1); }
          70% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(1.15); }
        }
        @keyframes zoomFlash {
          0% { opacity: 0; transform: scale(0.6); }
          25% { opacity: 1; transform: scale(1.4); }
          50% { opacity: 1; transform: scale(1.0); }
          100% { opacity: 0; transform: scale(1.6); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function Row({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/85">
      <span className="text-lg w-6 text-center">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
