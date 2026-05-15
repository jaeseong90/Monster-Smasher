"use client";

import { create } from "zustand";
import type { WeaponId } from "./store";

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

interface ProgState {
  bestScore: number;
  bestWave: number;
  totalKills: number;
  unlockedWeapons: Set<WeaponId>;
  achievements: Achievement[];
  recordRun: (score: number, wave: number, kills: number) => Achievement[];
  isWeaponLocked: (w: WeaponId) => boolean;
  load: () => void;
  reset: () => void;
}

const DEFAULT_UNLOCKED: WeaponId[] = ["hammer", "greatsword", "bazooka", "flamethrower"];

const ACHIEVEMENTS: Omit<Achievement, "unlocked">[] = [
  { id: "first_kill", name: "첫 처치", desc: "몬스터를 한 마리 처치했어요" },
  { id: "wave5", name: "보스를 만나다", desc: "웨이브 5에 도달" },
  { id: "wave10", name: "균열 사냥꾼", desc: "웨이브 10 클리어" },
  { id: "score1k", name: "한가락", desc: "한 판에 1,000점" },
  { id: "score5k", name: "전설의 부부", desc: "한 판에 5,000점" },
  { id: "boss_kill", name: "보스 슬레이어", desc: "보스를 처치" },
  { id: "no_dish", name: "설거지 면제권", desc: "PvP에서 승리" },
  { id: "cpr_save", name: "심폐소생", desc: "파트너를 살리다" },
];

function loadFromStorage(): Partial<ProgState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("ms-progression");
    if (!raw) return {};
    const j = JSON.parse(raw);
    return {
      bestScore: j.bestScore ?? 0,
      bestWave: j.bestWave ?? 0,
      totalKills: j.totalKills ?? 0,
      unlockedWeapons: new Set([...(j.unlockedWeapons ?? DEFAULT_UNLOCKED)]),
      achievements: (j.achievements ?? []).map((a: any) => ({ ...a })),
    };
  } catch {
    return {};
  }
}

function persist(s: ProgState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    "ms-progression",
    JSON.stringify({
      bestScore: s.bestScore,
      bestWave: s.bestWave,
      totalKills: s.totalKills,
      unlockedWeapons: [...s.unlockedWeapons],
      achievements: s.achievements,
    })
  );
}

export const useProgression = create<ProgState>((set, get) => ({
  bestScore: 0,
  bestWave: 0,
  totalKills: 0,
  unlockedWeapons: new Set(DEFAULT_UNLOCKED),
  achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false })),

  load: () => {
    const loaded = loadFromStorage();
    set((s) => {
      const merged: ProgState = {
        ...s,
        bestScore: loaded.bestScore ?? s.bestScore,
        bestWave: loaded.bestWave ?? s.bestWave,
        totalKills: loaded.totalKills ?? s.totalKills,
        unlockedWeapons: loaded.unlockedWeapons ?? s.unlockedWeapons,
        achievements: ACHIEVEMENTS.map((a) => {
          const found = (loaded.achievements ?? []).find((x: any) => x.id === a.id);
          return { ...a, unlocked: found?.unlocked ?? false };
        }),
      };
      return merged;
    });
  },

  recordRun: (score, wave, kills) => {
    const newly: Achievement[] = [];
    set((s) => {
      const achievements = s.achievements.map((a) => ({ ...a }));
      const grant = (id: string) => {
        const a = achievements.find((x) => x.id === id);
        if (a && !a.unlocked) {
          a.unlocked = true;
          newly.push(a);
        }
      };
      if (kills > 0) grant("first_kill");
      if (wave >= 5) grant("wave5");
      if (wave >= 10) grant("wave10");
      if (score >= 1000) grant("score1k");
      if (score >= 5000) grant("score5k");

      const unlockedWeapons = new Set(s.unlockedWeapons);
      if (score >= 500) unlockedWeapons.add("pan");
      if (score >= 1000) unlockedWeapons.add("leek");
      if (score >= 2000) unlockedWeapons.add("squeaky");

      const out: ProgState = {
        ...s,
        bestScore: Math.max(s.bestScore, score),
        bestWave: Math.max(s.bestWave, wave),
        totalKills: s.totalKills + kills,
        unlockedWeapons,
        achievements,
      };
      persist(out);
      return out;
    });
    return newly;
  },

  isWeaponLocked: (w) => !get().unlockedWeapons.has(w),

  reset: () =>
    set(() => {
      const out: ProgState = {
        ...get(),
        bestScore: 0,
        bestWave: 0,
        totalKills: 0,
        unlockedWeapons: new Set(DEFAULT_UNLOCKED),
        achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false })),
      };
      persist(out);
      return out;
    }),
}));
