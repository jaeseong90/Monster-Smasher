import { create } from "zustand";
import { useNet } from "./net";

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

export type ItemType = "heart" | "ammo" | "star";

export interface DropItem {
  id: number;
  type: ItemType;
  x: number;
  z: number;
  born: number;
}

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
  downH: boolean;
  downW: boolean;
  cprH: number;
  cprW: number;
  husbandWeapon: WeaponId;
  wifeWeapon: WeaponId;
  monstersAlive: number;
  monstersKilled: number;
  floaters: FloatingText[];
  drops: DropItem[];
  partnerBonus: boolean;
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
  cprHusband: (n: number) => void;
  cprWife: (n: number) => void;
  setHusbandWeapon: (w: WeaponId) => void;
  setWifeWeapon: (w: WeaponId) => void;
  setAlive: (n: number) => void;
  killMonster: () => void;
  nextWave: () => void;
  pushFloater: (f: Omit<FloatingText, "id" | "born">) => void;
  pruneFloaters: () => void;
  dropItem: (type: ItemType, x: number, z: number) => void;
  collectDrop: (id: number) => void;
  pruneDrops: () => void;
  setPartnerBonus: (v: boolean) => void;
  healHusband: (n: number) => void;
  healWife: (n: number) => void;
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
  downH: false,
  downW: false,
  cprH: 0,
  cprW: 0,
  husbandWeapon: "hammer",
  wifeWeapon: "bazooka",
  monstersAlive: 0,
  monstersKilled: 0,
  floaters: [],
  drops: [],
  partnerBonus: false,
  start: () => set({ status: "playing", score: 0, combo: 0, wave: 1, hpH: 100, hpW: 100, downH: false, downW: false, cprH: 0, cprW: 0, monstersKilled: 0, floaters: [] }),
  reset: () => set({ status: "title", score: 0, combo: 0, wave: 1, hpH: 100, hpW: 100, downH: false, downW: false, cprH: 0, cprW: 0, monstersKilled: 0, floaters: [] }),
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
      if (s.downH) return {};
      const hp = Math.max(0, s.hpH - n);
      const down = hp === 0;
      const net = useNet.getState();
      const isSolo = !net.enabled || !net.remote;
      const status = down && (isSolo || s.downW) ? "gameover" : s.status;
      return { hpH: hp, downH: down, status };
    }),
  damageWife: (n) =>
    set((s) => {
      if (s.downW) return {};
      const hp = Math.max(0, s.hpW - n);
      const down = hp === 0;
      const net = useNet.getState();
      const isSolo = !net.enabled || !net.remote;
      const status = down && (isSolo || s.downH) ? "gameover" : s.status;
      return { hpW: hp, downW: down, status };
    }),
  cprHusband: (n: number) =>
    set((s) => {
      if (!s.downH) return {};
      const t = s.cprH + n;
      if (t >= 100) return { downH: false, cprH: 0, hpH: 40 };
      return { cprH: t };
    }),
  cprWife: (n: number) =>
    set((s) => {
      if (!s.downW) return {};
      const t = s.cprW + n;
      if (t >= 100) return { downW: false, cprW: 0, hpW: 40 };
      return { cprW: t };
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
  dropItem: (type, x, z) =>
    set((s) => ({
      drops: [...s.drops.slice(-12), { id: ++dropId, type, x, z, born: performance.now() }],
    })),
  collectDrop: (id) =>
    set((s) => ({ drops: s.drops.filter((d) => d.id !== id) })),
  pruneDrops: () =>
    set((s) => ({ drops: s.drops.filter((d) => performance.now() - d.born < 18000) })),
  setPartnerBonus: (v) => set({ partnerBonus: v }),
  healHusband: (n) => set((s) => ({ hpH: Math.min(100, s.hpH + n) })),
  healWife: (n) => set((s) => ({ hpW: Math.min(100, s.hpW + n) })),
}));

let dropId = 0;
