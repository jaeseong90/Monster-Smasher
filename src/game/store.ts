import { create } from "zustand";

export type WeaponId =
  | "hammer"
  | "greatsword"
  | "pan"
  | "leek"
  | "bazooka"
  | "flamethrower"
  | "squeaky";

export type Role = "husband" | "wife";

export interface WeaponDef {
  id: WeaponId;
  name: string;
  emoji: string;
  damage: number;
  knockback: number;
  range: number;
  arc: number;
  cooldown: number;
  ranged?: boolean;
  explosion?: number;
  squeaky?: boolean;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  hammer:       { id: "hammer",       name: "거대 망치",     emoji: "🔨", damage: 35, knockback: 28, range: 3.0, arc: 1.6, cooldown: 0.6 },
  greatsword:   { id: "greatsword",   name: "대검",         emoji: "🗡️", damage: 25, knockback: 18, range: 3.6, arc: 2.0, cooldown: 0.45 },
  pan:          { id: "pan",          name: "거대 프라이팬", emoji: "🍳", damage: 22, knockback: 32, range: 2.6, arc: 1.4, cooldown: 0.55 },
  leek:         { id: "leek",         name: "대파",         emoji: "🌱", damage: 12, knockback: 14, range: 3.2, arc: 1.8, cooldown: 0.25 },
  bazooka:      { id: "bazooka",      name: "바주카포",      emoji: "🚀", damage: 60, knockback: 45, range: 18, arc: 0, cooldown: 1.6, ranged: true, explosion: 4.0 },
  flamethrower: { id: "flamethrower", name: "화염방사기",    emoji: "🔥", damage: 8,  knockback: 6,  range: 6,  arc: 0.6, cooldown: 0.05, ranged: true },
  squeaky:      { id: "squeaky",      name: "뿅망치",        emoji: "🛠️", damage: 5,  knockback: 50, range: 2.2, arc: 1.2, cooldown: 0.35, squeaky: true },
};

export const HUSBAND_WEAPONS: WeaponId[] = ["hammer", "greatsword", "pan", "squeaky"];
export const WIFE_WEAPONS: WeaponId[] = ["bazooka", "flamethrower", "leek", "squeaky"];

export type GameStatus = "title" | "playing" | "paused" | "gameover";

export interface FloatingText {
  id: number;
  text: string;
  pos: [number, number, number];
  color: string;
  born: number;
}

interface GameState {
  status: GameStatus;
  score: number;
  combo: number;
  comboTimer: number;
  wave: number;
  hpH: number;
  hpW: number;
  husbandWeapon: WeaponId;
  wifeWeapon: WeaponId;
  monstersAlive: number;
  monstersKilled: number;
  floaters: FloatingText[];
  start: () => void;
  reset: () => void;
  pause: () => void;
  resume: () => void;
  setStatus: (s: GameStatus) => void;
  addScore: (n: number) => void;
  bumpCombo: () => void;
  decayCombo: (dt: number) => void;
  damageHusband: (n: number) => void;
  damageWife: (n: number) => void;
  setHusbandWeapon: (w: WeaponId) => void;
  setWifeWeapon: (w: WeaponId) => void;
  setAlive: (n: number) => void;
  killMonster: () => void;
  nextWave: () => void;
  pushFloater: (f: Omit<FloatingText, "id" | "born">) => void;
  pruneFloaters: () => void;
}

let floaterId = 0;

export const useGame = create<GameState>((set, get) => ({
  status: "title",
  score: 0,
  combo: 0,
  comboTimer: 0,
  wave: 1,
  hpH: 100,
  hpW: 100,
  husbandWeapon: "hammer",
  wifeWeapon: "bazooka",
  monstersAlive: 0,
  monstersKilled: 0,
  floaters: [],
  start: () => set({ status: "playing", score: 0, combo: 0, wave: 1, hpH: 100, hpW: 100, monstersKilled: 0, floaters: [] }),
  reset: () => set({ status: "title", score: 0, combo: 0, wave: 1, hpH: 100, hpW: 100, monstersKilled: 0, floaters: [] }),
  pause: () => set({ status: "paused" }),
  resume: () => set({ status: "playing" }),
  setStatus: (s) => set({ status: s }),
  addScore: (n) => set((s) => ({ score: s.score + n })),
  bumpCombo: () => set((s) => ({ combo: s.combo + 1, comboTimer: 2.5 })),
  decayCombo: (dt) => {
    const t = get().comboTimer - dt;
    if (t <= 0) set({ combo: 0, comboTimer: 0 });
    else set({ comboTimer: t });
  },
  damageHusband: (n) =>
    set((s) => {
      const hp = Math.max(0, s.hpH - n);
      const status = hp === 0 && s.hpW === 0 ? "gameover" : s.status;
      return { hpH: hp, status };
    }),
  damageWife: (n) =>
    set((s) => {
      const hp = Math.max(0, s.hpW - n);
      const status = hp === 0 && s.hpH === 0 ? "gameover" : s.status;
      return { hpW: hp, status };
    }),
  setHusbandWeapon: (w) => set({ husbandWeapon: w }),
  setWifeWeapon: (w) => set({ wifeWeapon: w }),
  setAlive: (n) => set({ monstersAlive: n }),
  killMonster: () => set((s) => ({ monstersKilled: s.monstersKilled + 1 })),
  nextWave: () => set((s) => ({ wave: s.wave + 1, hpH: Math.min(100, s.hpH + 25), hpW: Math.min(100, s.hpW + 25) })),
  pushFloater: (f) =>
    set((s) => ({
      floaters: [...s.floaters.slice(-20), { ...f, id: ++floaterId, born: performance.now() }],
    })),
  pruneFloaters: () =>
    set((s) => ({ floaters: s.floaters.filter((f) => performance.now() - f.born < 900) })),
}));
