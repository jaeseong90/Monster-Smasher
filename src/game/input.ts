"use client";

import { create } from "zustand";

export interface InputState {
  move: { x: number; y: number };
  aim: { x: number; y: number };
  attack: boolean;
  attackEdge: boolean;
  special: boolean;
  weaponSlot: number;
  setMove: (x: number, y: number) => void;
  setAim: (x: number, y: number) => void;
  setAttack: (v: boolean) => void;
  consumeAttackEdge: () => boolean;
  setSpecial: (v: boolean) => void;
  setWeaponSlot: (n: number) => void;
}

export const useInput = create<InputState>((set, get) => ({
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  attack: false,
  attackEdge: false,
  special: false,
  weaponSlot: 0,
  setMove: (x, y) => set({ move: { x, y } }),
  setAim: (x, y) => set({ aim: { x, y } }),
  setAttack: (v) =>
    set((s) => ({
      attack: v,
      attackEdge: v && !s.attack ? true : s.attackEdge,
    })),
  consumeAttackEdge: () => {
    const v = get().attackEdge;
    if (v) set({ attackEdge: false });
    return v;
  },
  setSpecial: (v) => set({ special: v }),
  setWeaponSlot: (n) => set({ weaponSlot: n }),
}));

if (typeof window !== "undefined") {
  const keys = new Set<string>();
  window.addEventListener("keydown", (e) => {
    keys.add(e.key.toLowerCase());
    const m = computeMove(keys);
    useInput.getState().setMove(m.x, m.y);
    if (e.key === " " || e.key === "Enter") useInput.getState().setAttack(true);
    if (/^[1-4]$/.test(e.key)) useInput.getState().setWeaponSlot(parseInt(e.key, 10) - 1);
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
    const m = computeMove(keys);
    useInput.getState().setMove(m.x, m.y);
    if (e.key === " " || e.key === "Enter") useInput.getState().setAttack(false);
  });

  function computeMove(keys: Set<string>) {
    let x = 0;
    let y = 0;
    if (keys.has("w") || keys.has("arrowup")) y -= 1;
    if (keys.has("s") || keys.has("arrowdown")) y += 1;
    if (keys.has("a") || keys.has("arrowleft")) x -= 1;
    if (keys.has("d") || keys.has("arrowright")) x += 1;
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      x /= mag;
      y /= mag;
    }
    return { x, y };
  }
}
