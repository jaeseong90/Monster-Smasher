"use client";

import { useEffect, useState } from "react";
import { useGame, HUSBAND_WEAPONS, WIFE_WEAPONS, WEAPONS, type WeaponId } from "../store";
import { useNet } from "../net";
import { useInput } from "../input";

export function HUD() {
  const score = useGame((s) => s.score);
  const combo = useGame((s) => s.combo);
  const wave = useGame((s) => s.wave);
  const hpH = useGame((s) => s.hpH);
  const hpW = useGame((s) => s.hpW);
  const downH = useGame((s) => s.downH);
  const downW = useGame((s) => s.downW);
  const cprH = useGame((s) => s.cprH);
  const cprW = useGame((s) => s.cprW);
  const myRole = useNet((s) => s.myRole);
  const connected = useNet((s) => s.connected);
  const enabled = useNet((s) => s.enabled);
  const room = useNet((s) => s.roomCode);
  const remote = useNet((s) => s.remote);
  const pause = useGame((s) => s.pause);

  const myHp = myRole === "husband" ? hpH : hpW;
  const partnerHp = myRole === "husband" ? hpW : hpH;
  const partnerRole = myRole === "husband" ? "wife" : "husband";
  const partnerLabel = partnerRole === "husband" ? "남편" : "아내";
  const myLabel = myRole === "husband" ? "남편" : "아내";
  const husbandWeapon = useGame((s) => s.husbandWeapon);
  const wifeWeapon = useGame((s) => s.wifeWeapon);
  const myWeapon = myRole === "husband" ? husbandWeapon : wifeWeapon;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-3">
        <div className="bg-black/55 backdrop-blur rounded-2xl px-3 py-2 border border-white/10 max-w-[55%]">
          <div className="text-[10px] uppercase tracking-widest text-white/60">{myLabel}</div>
          <HpBar hp={myHp} color={myRole === "husband" ? "#3aa6ff" : "#ff5fa3"} />
          <div className="mt-1 text-xs text-white/80 flex items-center gap-1">
            {WEAPONS[myWeapon].emoji} <span>{WEAPONS[myWeapon].name}</span>
          </div>
        </div>
        <div className="bg-black/55 backdrop-blur rounded-2xl px-3 py-2 border border-white/10 text-center">
          <div className="text-amber-300 text-xs font-bold">웨이브 {wave}</div>
          <div className="text-white text-xl font-bold tabular-nums">{score.toLocaleString()}</div>
          {combo >= 2 && <div className="text-[10px] text-pink-300 font-bold">COMBO ×{combo}</div>}
        </div>
        <div className="bg-black/55 backdrop-blur rounded-2xl px-3 py-2 border border-white/10 max-w-[55%]">
          <div className="text-[10px] uppercase tracking-widest text-white/60 text-right">{partnerLabel}</div>
          {enabled ? (
            connected && remote ? (
              <>
                <HpBar hp={partnerHp} color={partnerRole === "husband" ? "#3aa6ff" : "#ff5fa3"} />
                <div className="mt-1 text-xs text-white/80 text-right flex items-center justify-end gap-1">
                  {WEAPONS[remote.weapon as WeaponId]?.emoji} <span>{remote.name}</span>
                </div>
              </>
            ) : (
              <div className="text-white/60 text-xs">대기중…</div>
            )
          ) : (
            <div className="text-white/60 text-xs">싱글 플레이</div>
          )}
        </div>
      </div>

      {enabled && room && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/40 px-3 py-1 rounded-full text-xs text-white/80 border border-white/10">
          방 코드 <span className="font-mono font-bold text-amber-300">{room}</span>
        </div>
      )}

      <WeaponSwapper />

      <button
        onClick={pause}
        className="pointer-events-auto absolute top-2 left-1/2 -translate-x-1/2 -translate-y-[150%] mt-20 px-3 py-1 rounded-full bg-white/10 text-white text-xs border border-white/20 active:scale-95"
      >
        ⏸
      </button>

      <ComboFlash />

      {(myRole === "husband" && downH) || (myRole === "wife" && downW) ? (
        <DownOverlay role={myRole} progress={myRole === "husband" ? cprH : cprW} />
      ) : null}

      {(myRole === "husband" && downW) || (myRole === "wife" && downH) ? (
        <PartnerDownPrompt progress={myRole === "husband" ? cprW : cprH} />
      ) : null}
    </div>
  );
}

function DownOverlay({ role, progress }: { role: "husband" | "wife"; progress: number }) {
  return (
    <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm grid place-items-center text-center">
      <div className="max-w-xs space-y-3">
        <div className="text-6xl animate-pulse">{role === "husband" ? "🧔💫" : "👰💫"}</div>
        <h2 className="text-3xl font-black text-rose-300">기절!</h2>
        <p className="text-white/70 text-sm">파트너가 다가와서 깨워줄 때까지 버텨!</p>
        <div className="w-48 mx-auto h-2 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-rose-400 to-amber-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-white/50 italic">"여보… 일어나…"</div>
      </div>
    </div>
  );
}

function PartnerDownPrompt({ progress }: { progress: number }) {
  return (
    <div className="absolute bottom-44 left-1/2 -translate-x-1/2 z-25 bg-amber-400/90 text-black px-4 py-2 rounded-2xl font-bold text-sm shadow-lg animate-pulse">
      ❤️ 다가가서 공격 버튼 연타 — {Math.round(progress)}%
    </div>
  );
}

function HpBar({ hp, color }: { hp: number; color: string }) {
  return (
    <div className="w-32 h-2 bg-white/15 rounded-full overflow-hidden mt-1">
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${hp}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
      />
    </div>
  );
}

function WeaponSwapper() {
  const myRole = useNet((s) => s.myRole);
  const list = myRole === "husband" ? HUSBAND_WEAPONS : WIFE_WEAPONS;
  const slot = useInput((s) => s.weaponSlot);
  const setSlot = useInput((s) => s.setWeaponSlot);

  return (
    <div className="pointer-events-auto absolute top-24 left-1/2 -translate-x-1/2 flex gap-2">
      {list.map((w, i) => {
        const def = WEAPONS[w];
        const active = i === slot;
        return (
          <button
            key={w}
            onClick={() => setSlot(i)}
            className={`rounded-xl px-2.5 py-1.5 border text-xs flex items-center gap-1 active:scale-95 ${
              active
                ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_18px_rgba(255,200,80,0.5)]"
                : "bg-black/40 text-white/85 border-white/15"
            }`}
          >
            <span className="text-base leading-none">{def.emoji}</span>
            <span className="hidden sm:inline">{def.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function ComboFlash() {
  const combo = useGame((s) => s.combo);
  const [show, setShow] = useState<number | null>(null);
  useEffect(() => {
    if (combo >= 3) {
      setShow(combo);
      const t = setTimeout(() => setShow(null), 700);
      return () => clearTimeout(t);
    }
  }, [combo]);
  if (!show) return null;
  return (
    <div className="absolute top-32 left-1/2 -translate-x-1/2 text-pink-300 font-black text-4xl drop-shadow-[0_0_20px_rgba(255,90,180,0.8)] animate-pulse">
      {show}연타!!
    </div>
  );
}
